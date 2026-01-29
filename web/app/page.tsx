export default function HomePage() {
  return (
    <div className="grid grid-2 stagger">
      <div className="card">
        <h2>Quick Start</h2>
        <p style={{ color: "var(--muted)" }}>
          Log in with the demo account, upload a log, and review anomalies.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <a className="button" href="/login">Login</a>
          <a className="button" href="/upload">Upload</a>
        </div>
      </div>
      <div className="card">
        <h2>What You’ll See</h2>
        <div className="grid">
          <span className="badge">Timeline buckets</span>
          <span className="badge">Anomaly explanations</span>
          <span className="badge">Confidence scores</span>
          <span className="badge">Top sources & paths</span>
        </div>
      </div>
      <div className="card">
        <h2>Demo Credentials</h2>
        <p className="mono">demo@tenex.local</p>
        <p className="mono">password</p>
      </div>
      <div className="card">
        <h2>Log Format</h2>
        <p className="mono">
          2026-01-29T10:00:00Z 10.0.0.1 GET example.com /login 200 512
        </p>
      </div>
    </div>
  );
}
