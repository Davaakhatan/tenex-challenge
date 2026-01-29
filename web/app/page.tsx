"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    setAuthed(Boolean(localStorage.getItem("token")));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((payload) => setRecent(payload.uploads ?? []))
      .catch(() => setRecent([]));
  }, []);

  async function onDeleteRecent(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const ok = window.confirm("Delete this upload and its results?");
    if (!ok) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setRecent((prev) => prev.filter((u) => u.id !== id));
    const last = localStorage.getItem("lastUploadId");
    if (last === id) {
      localStorage.removeItem("lastUploadId");
    }
  }

  return (
    <div className="grid">
      <div className="hero">
        <h2 className="card-title">Threat Review Console</h2>
        <p className="subtle">
          Upload logs, build timelines, and surface anomalies with confidence scores.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {authed ? (
            <a className="button" href="/upload">Upload Logs</a>
          ) : (
            <a className="button" href="/login">Authenticate</a>
          )}
          <a className="button secondary" href="/results">View Results</a>
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

      {authed && (
        <div className="card">
          <h3 className="card-title">Recent uploads</h3>
          {recent.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Events</th>
                  <th>Anomalies</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 5).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <a className="pill" href={`/results?uploadId=${u.id}`}>
                        {u.filename}
                      </a>
                    </td>
                    <td>{u.events_count}</td>
                    <td>{u.anomalies_count}</td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td>
                      <button className="pill" type="button" onClick={() => onDeleteRecent(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="subtle">No uploads yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
