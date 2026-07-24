"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClaimSummary = {
  id: string;
  claimNumber: string;
  statusLabel: string;
  incidentType: string;
  location: string;
  contactName: string;
  vehicle: string;
  attachmentCount: number;
  createdAt: string;
};

export default function AdjusterQueuePage() {
  const [claims, setClaims] = useState<ClaimSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/adjuster/claims");
        const data = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          setError(data.error || "Failed to load claims");
          setClaims([]);
          return;
        }
        setClaims(data.claims);
      } catch {
        if (!cancelled) {
          setError("Unable to load adjuster queue.");
          setClaims([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell">
      <div className="panel stack">
        <h1>Adjuster desk</h1>
        <p className="muted">Open claims awaiting review or more information.</p>
        {claims === null && <p className="muted">Loading queue…</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {claims && claims.length === 0 && !error && (
          <div className="alert alert-ok">No open claims right now.</div>
        )}
        <div className="claim-list">
          {(claims || []).map((claim) => (
            <Link key={claim.id} href={`/adjuster/${claim.id}`} className="claim-row">
              <div className="claim-row__top">
                <strong>{claim.claimNumber}</strong>
                <span className="status-pill">{claim.statusLabel}</span>
              </div>
              <div className="muted">
                {claim.incidentType} · {claim.vehicle} · {claim.contactName}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {claim.location} · {claim.attachmentCount} photo(s) ·{" "}
                {new Date(claim.createdAt).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
