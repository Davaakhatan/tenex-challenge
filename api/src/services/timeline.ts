import type { LogEvent } from "./parser";

export type TimelineBucket = {
  window: string;
  count: number;
  topSrcIp: string;
};

export function buildTimeline(events: LogEvent[], windowMinutes = 1): TimelineBucket[] {
  const buckets = new Map<string, LogEvent[]>();
  for (const evt of events) {
    const date = new Date(evt.ts);
    if (Number.isNaN(date.getTime())) continue;
    const windowStart = new Date(date);
    windowStart.setSeconds(0, 0);
    const windowKey = windowStart.toISOString().slice(0, 16);
    if (!buckets.has(windowKey)) buckets.set(windowKey, []);
    buckets.get(windowKey)?.push(evt);
  }

  const result: TimelineBucket[] = [];
  for (const [window, list] of buckets.entries()) {
    const ipCounts: Record<string, number> = {};
    for (const evt of list) {
      ipCounts[evt.srcIp] = (ipCounts[evt.srcIp] ?? 0) + 1;
    }
    const topSrcIp = Object.entries(ipCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    result.push({ window, count: list.length, topSrcIp });
  }

  return result.sort((a, b) => a.window.localeCompare(b.window));
}
