"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Upload failed");
        return;
      }
      const data = await res.json();
      setResult(data);
      if (data?.upload?.id) {
        localStorage.setItem("lastUploadId", data.upload.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready) {
    return <div className="card">Checking authentication...</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 className="card-title">Upload logs</h2>
        <p className="subtle">Accepted: .log or .txt, up to 5MB.</p>
        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
          <input
            className="input"
            type="file"
            accept=".log,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={isSubmitting}
          />
          <button className="button" type="submit" disabled={!file || isSubmitting}>
            {isSubmitting ? "Analyzing..." : "Analyze"}
          </button>
        </form>
        {isSubmitting && (
          <p className="subtle" style={{ marginTop: 8 }}>
            Large files can take a minute. Please wait…
          </p>
        )}
        {error && (
          <p className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="card">
          <h3 className="card-title">Snapshot</h3>
          <div className="grid grid-2">
            <span className="badge">Events: {result.events?.length ?? 0}</span>
            <span className="badge">Anomalies: {result.anomalies?.length ?? 0}</span>
            <span className="badge">
              Parsed {result.summary?.parsedLines} / {result.summary?.totalLines} lines
            </span>
            <span className="badge">Timeline: {result.timeline?.length ?? 0} buckets</span>
          </div>
          {result.upload?.id && (
            <p style={{ marginTop: 12 }}>
              <a className="pill" href={`/results?uploadId=${result.upload.id}`}>View full results</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
