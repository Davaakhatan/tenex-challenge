"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uploadId = searchParams.get("uploadId");
  const [data, setData] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [lastUploadId, setLastUploadId] = useState<string | null>(null);
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis/${uploadId}`, {
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((res) => res.json())
      .then((payload) => setUploads(payload.uploads ?? []))
      .catch(() => setUploads([]));
  }, [uploadId]);

  async function onDeleteUpload(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const ok = window.confirm("Delete this upload and its results?");
    if (!ok) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setUploads((prev) => prev.filter((u) => u.id !== id));
    if (lastUploadId === id) {
      localStorage.removeItem("lastUploadId");
      setLastUploadId(null);
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
                        <button className="pill" type="button" onClick={() => onDeleteUpload(u.id)}>
                          Delete
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
            <div className="card">
              <h3 className="card-title">SOC learnings</h3>
              <div className="grid">
                <p className="subtle">
                  Total events: <strong>{data.events?.length ?? 0}</strong> with{" "}
                  <strong>{data.anomalies?.length ?? 0}</strong> anomalies flagged.
                </p>
                {data.stats && (
                  <>
                    <p className="subtle">
                      Top source IPs:{" "}
                      <strong>
                        {data.stats.topSrcIps.map((ip: any) => `${ip.ip} (${ip.count})`).join(", ")}
                      </strong>
                    </p>
                    <p className="subtle">
                      Top paths:{" "}
                      <strong>
                        {data.stats.topPaths.map((p: any) => `${p.path} (${p.count})`).join(", ")}
                      </strong>
                    </p>
                    <p className="subtle">
                      Error rate: <strong>{(data.stats.errorRate * 100).toFixed(1)}%</strong>
                    </p>
                  </>
                )}
                {data.timeline?.length ? (
                  <p className="subtle">
                    Timeline coverage:{" "}
                    <strong>
                      {data.timeline[0]?.window} → {data.timeline[data.timeline.length - 1]?.window}
                    </strong>
                  </p>
                ) : null}
              </div>
            </div>
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
