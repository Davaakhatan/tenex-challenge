"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    });
    if (!res.ok) {
      alert("Upload failed");
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="card">
      <h2>Upload Log</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          className="input"
          type="file"
          accept=".log,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="button" type="submit">Analyze</button>
      </form>

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Summary</h3>
          <p className="badge">Events: {result.events?.length ?? 0}</p>
          <p className="badge">Anomalies: {result.anomalies?.length ?? 0}</p>
          {result.timeline?.length ? (
            <p className="badge">Timeline buckets: {result.timeline.length}</p>
          ) : null}
          {result.summary && (
            <p className="badge">
              Parsed {result.summary.parsedLines} / {result.summary.totalLines} lines
            </p>
          )}
          {result.upload?.id && (
            <p>
              View full results: <a href={`/results?uploadId=${result.upload.id}`}>Open</a>
            </p>
          )}
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result.anomalies, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
