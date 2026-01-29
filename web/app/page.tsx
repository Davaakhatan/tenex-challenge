export default function HomePage() {
  return (
    <div className="grid">
      <div className="hero card">
        <h2 className="card-title">Threat Review Console</h2>
        <p className="subtle">
          Upload logs, build timelines, and surface anomalies with confidence scores.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="button" href="/login">Authenticate</a>
          <a className="button" href="/upload">Upload Logs</a>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h3 className="card-title">Signals</h3>
          <p className="subtle">Burst traffic, error spikes, rare destinations.</p>
          <div className="grid">
            <span className="pill">Confidence scoring</span>
            <span className="pill">Anomaly explanations</span>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Timeline</h3>
          <p className="subtle">Bucketed events show activity windows and top sources.</p>
          <div className="grid">
            <span className="pill">Top IPs</span>
            <span className="pill">Top paths</span>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Demo Access</h3>
          <p className="mono">demo@tenex.local</p>
          <p className="mono">password</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Log Format</h3>
        <p className="mono">2026-01-29T10:00:00Z 10.0.0.1 GET example.com /login 200 512</p>
        <p className="subtle">Accepted extensions: .log, .txt (max 5MB).</p>
      </div>
    </div>
  );
}
