import type { LogEvent } from "./parser";

export type SummaryStats = {
  totalEvents: number;
  topSrcIps: Array<{ ip: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
  errorRate: number;
};

export function buildSummary(events: LogEvent[]): SummaryStats {
  const totalEvents = events.length;
  const srcCounts: Record<string, number> = {};
  const pathCounts: Record<string, number> = {};
  let errorCount = 0;

  for (const evt of events) {
    srcCounts[evt.srcIp] = (srcCounts[evt.srcIp] ?? 0) + 1;
    pathCounts[evt.path] = (pathCounts[evt.path] ?? 0) + 1;
    if (evt.status >= 400) errorCount += 1;
  }

  const topSrcIps = Object.entries(srcCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topPaths = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const errorRate = totalEvents > 0 ? errorCount / totalEvents : 0;

  return { totalEvents, topSrcIps, topPaths, errorRate };
}
