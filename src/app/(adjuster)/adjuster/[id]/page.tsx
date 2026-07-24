"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { use, useState } from "react";

type ClaimDetail = {
  id: string;
  claimNumber: string;
  status: string;
  statusLabel: string;
  allowedTransitions: string[];
  incidentType: string;
  incidentDate: string;
  location: string;
  description: string;
  injuries: boolean;
  policeReport: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  plateEntered: string;
  policyVerified: boolean;
  adjusterNote: string | null;
  policy: {
    policyNumber: string;
    make: string;
    model: string;
    year: number;
    vin: string;
  } | null;
  attachments: { id: string; filename: string }[];
  timeline: { id: string; label: string; note: string | null; createdAt: string }[];
};

const ACTION_LABELS: Record<string, string> = {
  UNDER_REVIEW: "Mark under review",
  NEEDS_INFO: "Request more info",
  APPROVED: "Approve",
  DENIED: "Deny",
};

async function fetchClaim(id: string): Promise<ClaimDetail> {
  const res = await fetch(`/api/adjuster/claims/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Claim not found");
  }
  return data;
}

const claimCache = new Map<string, Promise<ClaimDetail>>();

function loadClaim(id: string, bust = false) {
  if (bust) {
    claimCache.delete(id);
  }
  let promise = claimCache.get(id);
  if (!promise) {
    promise = fetchClaim(id);
    claimCache.set(id, promise);
  }
  return promise;
}

function AdjusterDetailBody({ id }: { id: string }) {
  const initial = use(loadClaim(id));
  const [claim, setClaim] = useState(initial);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const next = await loadClaim(id, true);
    setClaim(next);
  }

  async function transition(status: string) {
    if (status === "DENIED" && !note.trim()) {
      setMessage("A denial reason is required.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/adjuster/claims/${claim.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Update failed");
        return;
      }
      setMessage(`Status updated to ${data.statusLabel}.`);
      setNote("");
      await refresh();
    } catch {
      setMessage("Network error updating status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel stack">
      <div className="claim-row__top">
        <div>
          <Link href="/adjuster" className="muted" style={{ fontSize: "0.9rem" }}>
            ← Queue
          </Link>
          <h1 style={{ marginTop: "0.35rem" }}>{claim.claimNumber}</h1>
        </div>
        <span className="status-pill">{claim.statusLabel}</span>
      </div>

      <div className="form-grid two">
        <div>
          <h3>Incident</h3>
          <p>{claim.incidentType}</p>
          <p className="muted">{new Date(claim.incidentDate).toLocaleString()}</p>
          <p>{claim.location}</p>
          <p>{claim.description}</p>
          <p className="muted">
            Injuries: {claim.injuries ? "Yes" : "No"} · Police report:{" "}
            {claim.policeReport ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <h3>Vehicle & contact</h3>
          <p>Plate {claim.plateEntered}</p>
          {claim.policy ? (
            <p>
              {claim.policy.year} {claim.policy.make} {claim.policy.model}
              <br />
              <span className="muted">
                {claim.policy.policyNumber} · VIN {claim.policy.vin}
              </span>
            </p>
          ) : (
            <p className="muted">No linked policy (unverified)</p>
          )}
          <p>
            {claim.contactName}
            <br />
            <span className="muted">
              {claim.contactEmail} · {claim.contactPhone}
            </span>
          </p>
        </div>
      </div>

      {claim.attachments.length > 0 && (
        <div>
          <h3>Evidence</h3>
          <div className="photo-preview">
            {claim.attachments.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.id}
                src={`/api/attachments/${a.id}?adjuster=1`}
                alt={a.filename}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3>Timeline</h3>
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
      </div>

      <div className="stack">
        <h3>Actions</h3>
        <label className="field">
          Note / denial reason
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required when denying; helpful for Needs Info"
          />
        </label>
        <div className="cta-row">
          {claim.allowedTransitions.map((status) => (
            <button
              key={status}
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => transition(status)}
            >
              {ACTION_LABELS[status] || status}
            </button>
          ))}
          {claim.allowedTransitions.length === 0 && (
            <p className="muted">This claim is in a terminal status.</p>
          )}
        </div>
        {message && (
          <div
            className={`alert ${message.includes("updated") ? "alert-ok" : "alert-error"}`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdjusterDetailPage() {
  const params = useParams<{ id: string }>();

  if (!params.id) {
    return (
      <div className="page-shell">
        <div className="panel">Missing claim id.</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <AdjusterDetailBody key={params.id} id={params.id} />
    </div>
  );
}
