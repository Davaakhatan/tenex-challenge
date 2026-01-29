"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uploadId = searchParams.get("uploadId");
  const [data, setData] = useState<any>(null);
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

  if (!ready) {
    return <div className="card">Checking authentication...</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 className="card-title">Analysis Results</h2>
        {!uploadId && <p className="subtle">Upload a log file first.</p>}
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
          <h3 className="card-title">Event Sample</h3>
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
