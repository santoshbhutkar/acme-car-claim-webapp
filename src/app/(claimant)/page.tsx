import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="hero-brand">
        <div className="hero__content">
          <p className="muted" style={{ marginBottom: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.78rem" }}>
            Auto claims, clarified
          </p>
          <h1 id="hero-brand" className="hero__brand">
            ACME
          </h1>
          <p className="hero__lede">
            Report an incident in minutes, keep your claim number close, and
            follow every status update without the phone tree.
          </p>
          <div className="cta-row">
            <Link href="/file-claim" className="btn btn-primary">
              File a claim
            </Link>
            <Link href="/track" className="btn btn-secondary">
              Track a claim
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
