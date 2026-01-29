import type { LogEvent } from "./parser";

export type Anomaly = {
  rule: string;
  explanation: string;
  confidence: number;
  event?: LogEvent;
};

function zScore(value: number, mean: number, std: number) {
  if (std === 0) return 0;
  return (value - mean) / std;
}

function confidenceFromZ(z: number, base = 0.4) {
  const c = base + Math.min(Math.abs(z) * 0.1, 0.5);
  return Math.max(0, Math.min(0.95, c));
}

export function detectAnomalies(events: LogEvent[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (events.length === 0) return anomalies;

  const byIp: Record<string, LogEvent[]> = {};
  const byHost: Record<string, LogEvent[]> = {};
  const bytesList: number[] = [];

  for (const evt of events) {
    if (!byIp[evt.srcIp]) byIp[evt.srcIp] = [];
    if (!byHost[evt.destHost]) byHost[evt.destHost] = [];
    byIp[evt.srcIp].push(evt);
    byHost[evt.destHost].push(evt);
    bytesList.push(evt.bytes);
  }

  // AI-based statistical model: request volume z-score per IP
  const ipCounts = Object.values(byIp).map((list) => list.length);
  const ipMean = ipCounts.reduce((a, b) => a + b, 0) / ipCounts.length;
  const ipVar = ipCounts.reduce((acc, v) => acc + (v - ipMean) ** 2, 0) / ipCounts.length;
  const ipStd = Math.sqrt(ipVar);
  for (const [ip, list] of Object.entries(byIp)) {
    const z = zScore(list.length, ipMean, ipStd);
    if (z >= 1.5) {
      anomalies.push({
        rule: "ip_request_rate",
        explanation: `Statistical outlier: ${ip} request volume z=${z.toFixed(2)}`,
        confidence: confidenceFromZ(z, 0.5),
        event: list[list.length - 1]
      });
    }
  }

  // Burst detection: 4+ requests from same IP within 3 seconds
  for (const [ip, list] of Object.entries(byIp)) {
    const sorted = [...list].sort((a, b) => a.ts.localeCompare(b.ts));
    for (let i = 0; i < sorted.length; i += 1) {
      const startTs = Date.parse(sorted[i].ts);
      if (Number.isNaN(startTs)) continue;
      let count = 1;
      let last = sorted[i];
      for (let j = i + 1; j < sorted.length; j += 1) {
        const nextTs = Date.parse(sorted[j].ts);
        if (Number.isNaN(nextTs)) continue;
        if (nextTs - startTs <= 3000) {
          count += 1;
          last = sorted[j];
        } else {
          break;
        }
      }
      if (count >= 4) {
        const confidence = Math.min(0.9, 0.6 + count * 0.05);
        anomalies.push({
          rule: "burst_requests",
          explanation: `Unusual burst from ${ip}: ${count} requests in <= 3s (model score)`,
          confidence,
          event: last
        });
        break;
      }
    }
  }

  // High error ratio per IP (>= 50% errors and at least 3 total)
  for (const [ip, list] of Object.entries(byIp)) {
    const errors = list.filter((e) => e.status >= 400).length;
    const ratio = errors / list.length;
    if (list.length >= 3 && ratio >= 0.5) {
      const confidence = Math.min(0.85, 0.4 + ratio * 0.6);
      anomalies.push({
        rule: "high_error_rate",
        explanation: `High error rate from ${ip}: ${errors}/${list.length} requests (model score)`,
        confidence,
        event: list[list.length - 1]
      });
    }
  }

  // Rare destination host (only once in file, with enough total events)
  if (events.length >= 5) {
    for (const [host, list] of Object.entries(byHost)) {
      if (list.length === 1) {
        anomalies.push({
          rule: "rare_destination",
          explanation: `Rare destination host: ${host}`,
          confidence: 0.55,
          event: list[0]
        });
      }
    }
  }

  // High bytes outlier
  const mean = bytesList.reduce((a, b) => a + b, 0) / bytesList.length;
  const variance =
    bytesList.reduce((acc, b) => acc + (b - mean) ** 2, 0) / bytesList.length;
  const std = Math.sqrt(variance);
  if (std > 0) {
    for (const evt of events) {
      const z = zScore(evt.bytes, mean, std);
      if (z > 2) {
        const confidence = confidenceFromZ(z, 0.4);
        anomalies.push({
          rule: "large_transfer",
          explanation: `Large transfer size (${evt.bytes} bytes, z=${z.toFixed(2)})`,
          confidence,
          event: evt
        });
      }
    }
  }

  return anomalies;
}
