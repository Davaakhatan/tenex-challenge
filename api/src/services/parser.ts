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

// Format: ISO_TS SRC_IP METHOD HOST PATH STATUS BYTES
export function parseLine(line: string): LogEvent | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 7) return null;

  const [ts, srcIp, method, destHost, path, statusStr, bytesStr] = parts;
  const status = Number(statusStr);
  const bytes = Number(bytesStr);
  if (!ts || !srcIp || !method || !destHost || !path) return null;
  if (Number.isNaN(status) || Number.isNaN(bytes)) return null;

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
  const lines = content.split(/\r?\n/);
  const events: LogEvent[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const evt = parseLine(line);
    if (evt) events.push(evt);
  }
  return events;
}
