"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IncidentType =
  | "COLLISION"
  | "THEFT"
  | "GLASS"
  | "WEATHER"
  | "VANDALISM"
  | "OTHER";

type PolicyMatch = {
  policyNumber: string;
  plate: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  holderName: string;
  holderEmail: string;
};

type FormState = {
  incidentType: IncidentType;
  incidentDate: string;
  location: string;
  description: string;
  injuries: boolean;
  policeReport: boolean;
  plate: string;
  policyNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const STEPS = ["Incident", "Vehicle", "Photos", "Review"] as const;

const INITIAL: FormState = {
  incidentType: "COLLISION",
  incidentDate: "",
  location: "",
  description: "",
  injuries: false,
  policeReport: false,
  plate: "",
  policyNumber: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export default function FileClaimPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [photos, setPhotos] = useState<File[]>([]);
  const [policy, setPolicy] = useState<PolicyMatch | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    claimNumber: string;
    policyVerified: boolean;
  } | null>(null);

  const previewUrls = useMemo(
    () => photos.map((file) => URL.createObjectURL(file)),
    [photos],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function lookupPolicy() {
    setLookupNote(null);
    setPolicy(null);
    setError(null);

    const params = new URLSearchParams();
    if (form.plate.trim()) {
      params.set("plate", form.plate.trim().toUpperCase());
    }
    if (form.policyNumber.trim()) {
      params.set("policyNumber", form.policyNumber.trim());
    }

    if (![...params.keys()].length) {
      setError("Enter a plate or policy number to look up coverage.");
      return;
    }

    const res = await fetch(`/api/policies/lookup?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      setLookupNote(
        "No matching policy yet — you can still submit; the claim will be flagged as unverified.",
      );
      return;
    }

    setPolicy(data);
    update("contactName", data.holderName);
    update("contactEmail", data.holderEmail);
    update("plate", data.plate);
    update("policyNumber", data.policyNumber);
    setLookupNote(`Matched ${data.year} ${data.make} ${data.model}.`);
  }

  function validateStep(): boolean {
    setError(null);
    if (step === 0) {
      if (!form.incidentDate || form.location.trim().length < 3 || form.description.trim().length < 10) {
        setError("Complete date, location, and a short description (10+ characters).");
        return false;
      }
    }
    if (step === 1) {
      if (!form.plate.trim() || !form.contactName.trim() || !form.contactEmail.trim() || !form.contactPhone.trim()) {
        setError("Plate and contact details are required.");
        return false;
      }
    }
    if (step === 2 && photos.length > 5) {
      setError("Upload at most 5 photos.");
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep()) {
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!validateStep()) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      photos.forEach((file) => body.append("photos", file));

      const res = await fetch("/api/claims", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submit failed");
        return;
      }
      setResult({
        claimNumber: data.claimNumber,
        policyVerified: data.policyVerified,
      });
    } catch {
      setError("Network error while submitting the claim.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="page-shell">
        <div className="panel confirm-burst stack" style={{ maxWidth: 560, margin: "2rem auto" }}>
          <p className="muted" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem" }}>
            Claim received
          </p>
          <h1>You&apos;re all set</h1>
          <p className="muted">
            Keep this claim number for tracking. An adjuster will review your
            file shortly.
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: 0 }}>
            {result.claimNumber}
          </p>
          {!result.policyVerified && (
            <div className="alert alert-warn">
              Policy could not be verified automatically. An adjuster will confirm coverage.
            </div>
          )}
          <div className="cta-row">
            <Link
              href={`/track?claimNumber=${encodeURIComponent(result.claimNumber)}&email=${encodeURIComponent(form.contactEmail)}`}
              className="btn btn-primary"
            >
              Track this claim
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1>File a claim</h1>
        <p className="muted">First notice of loss — four short steps.</p>

        <div className="stepper" aria-label="Progress">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={
                index === step ? "is-active" : index < step ? "is-done" : undefined
              }
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 0 && (
          <div className="stack" key="incident">
            <div className="form-grid two">
              <label className="field">
                Incident type
                <select
                  value={form.incidentType}
                  onChange={(e) => update("incidentType", e.target.value as IncidentType)}
                >
                  <option value="COLLISION">Collision</option>
                  <option value="THEFT">Theft</option>
                  <option value="GLASS">Glass</option>
                  <option value="WEATHER">Weather</option>
                  <option value="VANDALISM">Vandalism</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="field">
                Date &amp; time
                <input
                  type="datetime-local"
                  value={form.incidentDate}
                  onChange={(e) => update("incidentDate", e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              Location
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Street, city, state"
              />
            </label>
            <label className="field">
              What happened
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Briefly describe the incident"
              />
            </label>
            <div className="check-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.injuries}
                  onChange={(e) => update("injuries", e.target.checked)}
                />
                Injuries involved
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.policeReport}
                  onChange={(e) => update("policeReport", e.target.checked)}
                />
                Police report filed
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="stack" key="vehicle">
            <div className="form-grid two">
              <label className="field">
                License plate
                <input
                  value={form.plate}
                  onChange={(e) => update("plate", e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                />
              </label>
              <label className="field">
                Policy number (optional)
                <input
                  value={form.policyNumber}
                  onChange={(e) => update("policyNumber", e.target.value)}
                  placeholder="POL-1001"
                />
              </label>
            </div>
            <button type="button" className="btn btn-secondary" onClick={lookupPolicy}>
              Look up policy
            </button>
            {lookupNote && (
              <div className={`alert ${policy ? "alert-ok" : "alert-warn"}`}>
                {lookupNote}
                {policy && (
                  <div style={{ marginTop: "0.35rem" }}>
                    VIN {policy.vin} · {policy.holderName}
                  </div>
                )}
              </div>
            )}
            <div className="form-grid two">
              <label className="field">
                Contact name
                <input
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                />
              </label>
              <label className="field">
                Phone
                <input
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              Email
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </label>
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
              Demo plates: ABC-1234, XYZ-9876, DEF-4567, GHI-5555
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="stack" key="photos">
            <label className="field">
              Damage / scene photos (optional, max 5)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => {
                  const list = Array.from(e.target.files || []).slice(0, 5);
                  setPhotos(list);
                }}
              />
            </label>
            {previewUrls.length > 0 && (
              <div className="photo-preview">
                {previewUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="Upload preview" />
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="stack" key="review">
            <h2 style={{ fontSize: "1.25rem" }}>Review</h2>
            <p><strong>Type:</strong> {form.incidentType}</p>
            <p><strong>When:</strong> {form.incidentDate || "—"}</p>
            <p><strong>Where:</strong> {form.location}</p>
            <p><strong>Details:</strong> {form.description}</p>
            <p><strong>Plate:</strong> {form.plate}</p>
            <p><strong>Contact:</strong> {form.contactName} · {form.contactEmail}</p>
            <p><strong>Photos:</strong> {photos.length}</p>
            <p><strong>Policy:</strong> {policy ? "Verified match" : "Unverified / not matched"}</p>
          </div>
        )}

        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          {step > 0 && (
            <button type="button" className="btn btn-secondary" onClick={back}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit claim"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
