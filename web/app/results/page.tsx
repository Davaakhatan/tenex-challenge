"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const uploadId = searchParams.get("uploadId");
  const [data, setData] = useState<any>(null);

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

  return (
    <div className="card fade-in">
      <h2>Results</h2>
      {!uploadId && <p>Use the Upload page to analyze a log file.</p>}
      {uploadId && !data && <p>Loading results for {uploadId}...</p>}
      {data && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <span className="badge">Events: {data.events?.length ?? 0}</span>{" "}
            <span className="badge">Anomalies: {data.anomalies?.length ?? 0}</span>
          </div>
          <div>
            <h3>Anomalies</h3>
            {data.anomalies?.length ? (
              data.anomalies.map((a: any) => (
                <div key={a.id} className="anomaly">
                  <strong>{a.rule}</strong> - {a.explanation} (conf {Number(a.confidence).toFixed(2)})
                </div>
              ))
            ) : (
              <p>No anomalies detected.</p>
            )}
          </div>
          {data.stats && (
            <div>
              <h3>Summary</h3>
              <p className="badge">Error rate: {(data.stats.errorRate * 100).toFixed(1)}%</p>
              <p className="badge">
                Top IPs: {data.stats.topSrcIps.map((ip: any) => `${ip.ip} (${ip.count})`).join(", ")}
              </p>
              <p className="badge">
                Top paths: {data.stats.topPaths.map((p: any) => `${p.path} (${p.count})`).join(", ")}
              </p>
            </div>
          )}
          <div>
            <h3>Events (sample)</h3>
            {data.events?.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Time</th>
                    <th style={{ textAlign: "left" }}>Source</th>
                    <th style={{ textAlign: "left" }}>Dest</th>
                    <th style={{ textAlign: "left" }}>Path</th>
                    <th style={{ textAlign: "left" }}>Status</th>
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
            ) : (
              <p>No events.</p>
            )}
          </div>
          <div>
            <h3>Timeline</h3>
            {data.timeline?.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Window</th>
                    <th style={{ textAlign: "left" }}>Events</th>
                    <th style={{ textAlign: "left" }}>Top Source IP</th>
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
              <p>No timeline data.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
