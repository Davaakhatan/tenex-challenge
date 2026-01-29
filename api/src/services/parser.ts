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

// Nginx access log (common/combined)
const nginxPattern =
  /^(\S+)\s+-\s+\S+\s+\[([^\]]+)\]\s+\"(\S+)\s+(\S+)[^\"]*\"\s+(\d{3})\s+(\d+|-)$/;

// Squid native access log format (simplified)
const squidPattern =
  /^(\d+\.\d+)\s+\d+\s+(\S+)\s+(\S+)\/(\d{3})\s+(\d+)\s+(\S+)\s+(\S+)/;

// Zscaler-like CSV: datetime,src_ip,user,url,action,status,bytes
const zscalerHeader = /^datetime,/i;

// Syslog (RFC3164-ish) with key=val payload expected
const syslogPattern = /^(\w{3})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s+(.*)$/;

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

function parseApacheDate(dateStr: string): string | null {
  const dateMatch = dateStr.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+-]\d{4})/);
  if (!dateMatch) return null;
  const [, day, mon, year, hh, mm, ss, tz] = dateMatch;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };
  const month = months[mon];
  if (!month) return null;
  return new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}${tz}`).toISOString();
}

function parseApache(line: string): LogEvent | null {
  const match = line.trim().match(apachePattern);
  if (!match) return null;

  const [, srcIp, dateStr, method, path, statusStr, bytesStr] = match;
  const status = Number(statusStr);
  const bytes = bytesStr === "-" ? 0 : Number(bytesStr);
  const ts = parseApacheDate(dateStr);
  if (!ts) return null;
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

function parseNginx(line: string): LogEvent | null {
  const match = line.trim().match(nginxPattern);
  if (!match) return null;

  const [, srcIp, dateStr, method, path, statusStr, bytesStr] = match;
  const status = Number(statusStr);
  const bytes = bytesStr === "-" ? 0 : Number(bytesStr);
  const ts = parseApacheDate(dateStr);
  if (!ts || Number.isNaN(status) || Number.isNaN(bytes)) return null;

  return {
    ts,
    srcIp,
    destHost: "nginx.local",
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

function parseJsonLine(line: string): LogEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) return null;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  const jsonSlice = trimmed.slice(first, last + 1);
  let obj: any;
  try {
    obj = JSON.parse(jsonSlice);
  } catch {
    return null;
  }

  const ts =
    obj.timestamp ||
    obj.time ||
    obj.ts ||
    obj.datetime ||
    obj.LogTimestamp ||
    obj.TimestampRequestReceiveStart;
  const srcIp =
    obj.src_ip ||
    obj.ip ||
    obj.client_ip ||
    obj.remote_ip ||
    obj.ClientPublicIp;
  const method = obj.method || obj.http_method || obj.Method || "GET";
  const path = obj.path || obj.uri || obj.url_path || obj.URL || "/";
  const status = Number(obj.status || obj.status_code || obj.StatusCode);
  const bytes = Number(obj.bytes || obj.size || obj.response_bytes || obj.ResponseSize || 0);
  const destHost = obj.dest_host || obj.host || obj.hostname || obj.Host || "app.local";

  if (!ts || !srcIp || !path) return null;
  if (Number.isNaN(Date.parse(ts))) return null;
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

function parseKeyValuePayload(payload: string, fallbackTs?: string): LogEvent | null {
  const pairs: Record<string, string> = {};
  const tokens = payload.split(/\s+/);
  for (const token of tokens) {
    const idx = token.indexOf("=");
    if (idx === -1) continue;
    const key = token.slice(0, idx);
    const value = token.slice(idx + 1);
    pairs[key] = value;
  }

  const ts = pairs.ts || pairs.timestamp || fallbackTs;
  const srcIp = pairs.src || pairs.src_ip || pairs.ip;
  const destHost = pairs.host || pairs.dest || pairs.dest_host || "app.local";
  const method = pairs.method || "GET";
  const path = pairs.path || pairs.uri || "/";
  const status = Number(pairs.status || 0);
  const bytes = Number(pairs.bytes || pairs.size || 0);

  if (!ts || !srcIp) return null;
  if (Number.isNaN(Date.parse(ts))) return null;

  return {
    ts,
    srcIp,
    destHost,
    method,
    path,
    status,
    bytes,
    raw: payload
  };
}

function parseSyslog(line: string): LogEvent | null {
  const match = line.trim().match(syslogPattern);
  if (!match) return null;
  const [, mon, day, time, host, _proc, payload] = match;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };
  const month = months[mon];
  if (!month) return null;
  const year = new Date().getUTCFullYear();
  const ts = new Date(`${year}-${month}-${String(day).padStart(2, "0")}T${time}Z`).toISOString();
  const evt = parseKeyValuePayload(payload, ts);
  if (evt) {
    return { ...evt, destHost: evt.destHost || host, raw: line };
  }
  return null;
}

function parseKeyValueLine(line: string): LogEvent | null {
  if (!line.includes("=")) return null;
  return parseKeyValuePayload(line);
}

export function parseLine(line: string): LogEvent | null {
  return (
    parseCustomFormat(line) ??
    parseApache(line) ??
    parseNginx(line) ??
    parseSquid(line) ??
    parseZscalerCsv(line) ??
    parseJsonLine(line) ??
    parseSyslog(line) ??
    parseKeyValueLine(line)
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
