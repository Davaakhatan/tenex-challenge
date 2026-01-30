"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultsClient() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const searchParams = useSearchParams();
  const router = useRouter();
  const uploadId = searchParams.get("uploadId");
  const [data, setData] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [lastUploadId, setLastUploadId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!uploadId) return;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/analysis/${uploadId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, [uploadId]);

  useEffect(() => {
    if (uploadId) return;
    const token = localStorage.getItem("token");
    const last = localStorage.getItem("lastUploadId");
    setLastUploadId(last);
    fetch(`${API_URL}/uploads`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((res) => res.json())
      .then((payload) => setUploads(payload.uploads ?? []))
      .catch(() => setUploads([]));
  }, [uploadId]);

  async function onDeleteUpload(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (deletingIds.has(id)) return;
    const ok = window.confirm("Delete this upload and all related results?");
    if (!ok) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${API_URL}/uploads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? "Delete failed");
        return;
      }
      setUploads((prev) => prev.filter((u) => u.id !== id));
      if (lastUploadId === id) {
        localStorage.removeItem("lastUploadId");
        setLastUploadId(null);
      }
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (!ready) {
    return <div className="card">Checking authentication...</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 className="card-title">Analysis results</h2>
        {!uploadId && (
          <>
            <p className="subtle">Pick a previous upload to view results.</p>
            {lastUploadId && (
              <p style={{ marginTop: 8 }}>
                <a className="pill" href={`/results?uploadId=${lastUploadId}`}>Open last upload</a>
              </p>
            )}
            {uploads.length ? (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Events</th>
                    <th>Anomalies</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <a className="pill" href={`/results?uploadId=${u.id}`}>
                          {u.filename}
                        </a>
                      </td>
                      <td>{u.status}</td>
                      <td>{u.events_count}</td>
                      <td>{u.anomalies_count}</td>
                      <td>{new Date(u.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="pill action-button"
                          type="button"
                          onClick={() => onDeleteUpload(u.id)}
                          disabled={deletingIds.has(u.id)}
                        >
                          {deletingIds.has(u.id) ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="subtle" style={{ marginTop: 12 }}>No uploads yet.</p>
            )}
          </>
        )}
        {uploadId && !data && <p className="subtle">Loading analysis...</p>}
        {data && (
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="grid grid-2">
              <span className="badge">Events: {data.events?.length ?? 0}</span>
              <span className="badge">Anomalies: {data.anomalies?.length ?? 0}</span>
              {data.stats && (
                <span className="badge">Error rate: {(data.stats.errorRate * 100).toFixed(1)}%</span>
              )}
            </div>
            {data.stats && (
              <div className="grid grid-2">
                <span className="pill">
                  Top IPs: {data.stats.topSrcIps.map((ip: any) => `${ip.ip} (${ip.count})`).join(", ")}
                </span>
                <span className="pill">
                  Top paths: {data.stats.topPaths.map((p: any) => `${p.path} (${p.count})`).join(", ")}
                </span>
              </div>
            )}
            {data.timeline?.length ? (
              <p className="subtle">
                Timeline summary: {data.timeline.length} buckets from{" "}
                <strong>
                  {data.timeline[0]?.window} → {data.timeline[data.timeline.length - 1]?.window}
                </strong>
              </p>
            ) : null}
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title">Anomalies</h3>
            {data.anomalies?.length ? (
              <div className="grid">
                {data.anomalies.map((a: any) => (
                  <div key={a.id} className="anomaly">
                    <strong>{a.rule}</strong> - {a.explanation} (conf {Number(a.confidence).toFixed(2)})
                  </div>
                ))}
              </div>
            ) : (
              <p className="subtle">No anomalies detected.</p>
            )}
          </div>
          <div className="card">
            <h3 className="card-title">Timeline</h3>
            {data.timeline?.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Window</th>
                    <th>Events</th>
                    <th>Top Source IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeline.map((t: any) => (
                    <tr key={t.window}>
                      <td>{t.window}</td>
                      <td>{t.count}</td>
                      <td>{t.topSrcIp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="subtle">No timeline data.</p>
            )}
          </div>
        </div>
      )}

      {data?.events?.length ? (
        <div className="card">
          <h3 className="card-title">Event sample</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Dest</th>
                <th>Path</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.events.slice(0, 10).map((e: any) => {
                const flagged = data.anomalies?.some((a: any) => a.event_id === e.id);
                return (
                  <tr key={e.id} className={flagged ? "anomaly" : undefined}>
                    <td>{e.ts}</td>
                    <td>{e.src_ip ?? e.srcIp}</td>
                    <td>{e.dest_host ?? e.destHost}</td>
                    <td>{e.path}</td>
                    <td>{e.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
