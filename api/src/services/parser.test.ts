import assert from "node:assert/strict";
import { parseLine, parseLogWithStats } from "./parser";

const validLine = "2026-01-29T10:00:00Z 10.0.0.1 GET example.com /login 200 512";
const invalidLine = "not-a-timestamp 10.0.0.1 GET example.com /login 200 512";

const parsed = parseLine(validLine);
assert.ok(parsed, "valid line should parse");
assert.equal(parsed?.srcIp, "10.0.0.1");
assert.equal(parsed?.status, 200);

const bad = parseLine(invalidLine);
assert.equal(bad, null, "invalid line should return null");

const content = [validLine, invalidLine, validLine].join("\n");
const { events, summary } = parseLogWithStats(content);
assert.equal(events.length, 2);
assert.equal(summary.totalLines, 3);
assert.equal(summary.parsedLines, 2);
assert.equal(summary.invalidLines, 1);

console.log("parser tests passed");
