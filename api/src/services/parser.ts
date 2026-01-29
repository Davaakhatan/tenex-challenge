export type LogEvent = {
  ts: string;
  srcIp: string;
  destHost: string;
  method: string;
  path: string;
  status: number;
  bytes: number;
  raw: string;
};

export type ParseSummary = {
  totalLines: number;
  parsedLines: number;
  invalidLines: number;
  invalidSamples: string[];
};

const linePattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d{3})\s+(\d+)$/;

// Format: ISO_TS SRC_IP METHOD HOST PATH STATUS BYTES
export function parseLine(line: string): LogEvent | null {
  const match = line.trim().match(linePattern);
  if (!match) return null;

  const [, ts, srcIp, method, destHost, path, statusStr, bytesStr] = match;
  const status = Number(statusStr);
  const bytes = Number(bytesStr);
  if (!ts || !srcIp || !method || !destHost || !path) return null;
  if (Number.isNaN(status) || Number.isNaN(bytes)) return null;
  if (Number.isNaN(Date.parse(ts))) return null;

  return {
    ts,
    srcIp,
    destHost,
    method,
    path,
    status,
    bytes,
    raw: line
  };
}

export function parseLog(content: string): LogEvent[] {
  return parseLogWithStats(content).events;
}

export function parseLogWithStats(content: string): { events: LogEvent[]; summary: ParseSummary } {
  const lines = content.split(/\r?\n/);
  const events: LogEvent[] = [];
  let invalidLines = 0;
  const invalidSamples: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const evt = parseLine(line);
    if (evt) events.push(evt);
    else {
      invalidLines += 1;
      if (invalidSamples.length < 5) invalidSamples.push(line);
    }
  }
  const summary: ParseSummary = {
    totalLines: lines.filter((line) => line.trim()).length,
    parsedLines: events.length,
    invalidLines,
    invalidSamples
  };
  return { events, summary };
}
