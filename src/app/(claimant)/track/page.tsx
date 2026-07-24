"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type TimelineItem = {
  id: string;
  label: string;
  note: string | null;
  createdAt: string;
};

type ClaimView = {
  claimNumber: string;
  status: string;
  statusLabel: string;
  incidentType: string;
  incidentDate: string;
  location: string;
  description: string;
  contactEmail: string;
  plateEntered: string;
  policyVerified: boolean;
  adjusterNote: string | null;
  timeline: TimelineItem[];
  attachments: { id: string; filename: string }[];
};

function TrackClaimInner() {
  const searchParams = useSearchParams();
  const urlClaim = (searchParams.get("claimNumber") || "").toUpperCase();
  const urlEmail = searchParams.get("email") || "";

  const [claimNumber, setClaimNumber] = useState(urlClaim);
  const [email, setEmail] = useState(urlEmail);
  const [claim, setClaim] = useState<ClaimView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  async function lookup(cn = claimNumber, em = email) {
    setLoading(true);
    setError(null);
    setUploadMsg(null);
    try {
      const params = new URLSearchParams({ email: em.trim() });
      const res = await fetch(
        `/api/claims/${encodeURIComponent(cn.trim().toUpperCase())}?${params}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setClaim(null);
        setError(data.error || "Claim not found");
        return;
      }
      setClaim(data);
    } catch {
      setError("Unable to look up claim right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!urlClaim || !urlEmail) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ email: urlEmail.trim() });
        const res = await fetch(
          `/api/claims/${encodeURIComponent(urlClaim)}?${params}`,
        );
        const data = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setClaim(null);
          setError(data.error || "Claim not found");
          return;
        }
        setClaim(data);
      } catch {
        if (!cancelled) {
          setError("Unable to look up claim right now.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlClaim, urlEmail]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await lookup();
  }

  async function uploadMore() {
    if (!claim) {
      return;
    }
    setUploadMsg(null);
    const body = new FormData();
    if (note.trim()) {
      body.append("note", note.trim());
    }
    photos.forEach((file) => body.append("photos", file));

    const params = new URLSearchParams({ email: email.trim() });
    const res = await fetch(
      `/api/claims/${encodeURIComponent(claim.claimNumber)}/attachments?${params}`,
      { method: "POST", body },
    );
    const data = await res.json();
    if (!res.ok) {
      setUploadMsg(data.error || "Upload failed");
      return;
    }
    setUploadMsg("Additional evidence submitted.");
    setNote("");
    setPhotos([]);
    await lookup(claim.claimNumber, email);
  }

  return (
    <div className="page-shell">
      <div className="panel stack" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1>Track a claim</h1>
        <p className="muted">Enter your claim number and the email used when filing.</p>

        <form className="stack" onSubmit={onSubmit}>
          <div className="form-grid two">
            <label className="field">
              Claim number
              <input
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value.toUpperCase())}
                placeholder="CLM-2026-0001"
              />
            </label>
            <label className="field">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.lee@email.com"
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Looking up…" : "Find claim"}
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {claim && (
          <div className="stack" style={{ marginTop: "0.5rem" }}>
            <div className="claim-row__top">
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>
                {claim.claimNumber}
              </h2>
              <span className="status-pill">{claim.statusLabel}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {claim.incidentType} · {new Date(claim.incidentDate).toLocaleString()} ·{" "}
              {claim.plateEntered}
              {claim.policyVerified ? " · policy verified" : " · policy unverified"}
            </p>
            <p>{claim.description}</p>
            <p className="muted">{claim.location}</p>

            <h3 style={{ marginBottom: 0 }}>Status timeline</h3>
            <ul className="timeline">
              {claim.timeline.map((item) => (
                <li key={item.id}>
                  <strong>{item.label}</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  {item.note && <div>{item.note}</div>}
                </li>
              ))}
            </ul>

            {claim.attachments.length > 0 && (
              <div>
                <h3>Evidence</h3>
                <div className="photo-preview">
                  {claim.attachments.map((a) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={a.id}
                      src={`/api/attachments/${a.id}?email=${encodeURIComponent(email)}`}
                      alt={a.filename}
                    />
                  ))}
                </div>
              </div>
            )}

            {claim.status === "NEEDS_INFO" && (
              <div className="stack">
                <div className="alert alert-warn">
                  An adjuster asked for more information.
                  {claim.adjusterNote ? ` Note: ${claim.adjusterNote}` : ""}
                </div>
                <label className="field">
                  Add a note
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <label className="field">
                  Additional photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 5))}
                  />
                </label>
                <button type="button" className="btn btn-primary" onClick={uploadMore}>
                  Submit additional evidence
                </button>
                {uploadMsg && <div className="alert alert-ok">{uploadMsg}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="panel">Loading…</div>
        </div>
      }
    >
      <TrackClaimInner />
    </Suspense>
  );
}
