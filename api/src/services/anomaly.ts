import type { LogEvent } from "./parser";

export type Anomaly = {
  rule: string;
  explanation: string;
  confidence: number;
  event?: LogEvent;
};

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
          explanation: `Unusual burst from ${ip}: ${count} requests in <= 3s`,
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
    if (list.length >= 3 && errors / list.length >= 0.5) {
      const confidence = Math.min(0.85, 0.4 + (errors / list.length) * 0.6);
      anomalies.push({
        rule: "high_error_rate",
        explanation: `High error rate from ${ip}: ${errors}/${list.length} requests`,
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
      if (evt.bytes > mean + 2 * std) {
        const z = (evt.bytes - mean) / std;
        const confidence = Math.min(0.9, 0.4 + z * 0.1);
        anomalies.push({
          rule: "large_transfer",
          explanation: `Large transfer size (${evt.bytes} bytes)`,
          confidence,
          event: evt
        });
      }
    }
  }

  return anomalies;
}
