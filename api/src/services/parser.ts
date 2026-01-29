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

// Apache Common/Combined Log Format
const apachePattern =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+\"(\S+)\s+(\S+)[^\"]*\"\s+(\d{3})\s+(\d+|-)$/;

// Squid native access log format (simplified)
const squidPattern =
  /^(\d+\.\d+)\s+\d+\s+(\S+)\s+(\S+)\/(\d{3})\s+(\d+)\s+(\S+)\s+(\S+)/;

// Zscaler-like CSV: datetime,src_ip,user,url,action,status,bytes
const zscalerHeader = /^datetime,/i;

// Format: ISO_TS SRC_IP METHOD HOST PATH STATUS BYTES
function parseCustomFormat(line: string): LogEvent | null {
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

function parseApache(line: string): LogEvent | null {
  const match = line.trim().match(apachePattern);
  if (!match) return null;

  const [, srcIp, dateStr, method, path, statusStr, bytesStr] = match;
  const status = Number(statusStr);
  const bytes = bytesStr === "-" ? 0 : Number(bytesStr);
  const dateMatch = dateStr.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+-]\d{4})/);
  if (!dateMatch) return null;
  const [, day, mon, year, hh, mm, ss, tz] = dateMatch;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };
  const month = months[mon];
  if (!month) return null;
  const ts = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}${tz}`).toISOString();
  if (Number.isNaN(status) || Number.isNaN(bytes)) return null;

  return {
    ts,
    srcIp,
    destHost: "apache.local",
    method,
    path,
    status,
    bytes,
    raw: line
  };
}

function parseSquid(line: string): LogEvent | null {
  const match = line.trim().match(squidPattern);
  if (!match) return null;

  const [, tsSeconds, srcIp, _code, statusStr, bytesStr, method, urlStr] = match;
  const status = Number(statusStr);
  const bytes = Number(bytesStr);
  if (Number.isNaN(status) || Number.isNaN(bytes)) return null;

  let destHost = "unknown";
  let path = "/";
  try {
    const url = new URL(urlStr);
    destHost = url.hostname;
    path = url.pathname;
  } catch {
    // best-effort fallback
    path = urlStr;
  }

  const ts = new Date(Number(tsSeconds) * 1000).toISOString();

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

function parseZscalerCsv(line: string): LogEvent | null {
  if (zscalerHeader.test(line)) return null;
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length < 7) return null;

  const [ts, srcIp, _user, urlStr, _action, statusStr, bytesStr] = parts;
  const status = Number(statusStr);
  const bytes = Number(bytesStr);
  if (Number.isNaN(status) || Number.isNaN(bytes)) return null;

  let destHost = "unknown";
  let path = "/";
  let method = "GET";
  try {
    const url = new URL(urlStr);
    destHost = url.hostname;
    path = url.pathname || "/";
  } catch {
    path = urlStr;
  }

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

export function parseLine(line: string): LogEvent | null {
  return (
    parseCustomFormat(line) ??
    parseApache(line) ??
    parseSquid(line) ??
    parseZscalerCsv(line)
  );
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
