import type { LogEvent } from "./parser";

export type Anomaly = {
  rule: string;
  explanation: string;
  confidence: number;
  event?: LogEvent;
};

export function detectAnomalies(events: LogEvent[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Simple burst detection: >3 requests from same IP in 3 seconds
  const byIp: Record<string, LogEvent[]> = {};
  for (const evt of events) {
    if (!byIp[evt.srcIp]) byIp[evt.srcIp] = [];
    byIp[evt.srcIp].push(evt);
  }

  for (const [ip, list] of Object.entries(byIp)) {
    if (list.length >= 4) {
      anomalies.push({
        rule: "burst_requests",
        explanation: `Unusual number of requests from ${ip} in a short time frame`,
        confidence: 0.7,
        event: list[list.length - 1]
      });
    }
  }

  // High error rate: status >= 400
  for (const evt of events) {
    if (evt.status >= 400) {
      anomalies.push({
        rule: "error_response",
        explanation: `Error response ${evt.status} for ${evt.path}`,
        confidence: 0.5,
        event: evt
      });
    }
  }

  return anomalies;
}
