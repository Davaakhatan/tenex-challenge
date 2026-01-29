import { Router } from "express";
import { query } from "../db";
import { buildTimeline } from "../services/timeline";
import { requireAuth } from "../middleware/auth";
import { buildSummary } from "../services/summary";

const router = Router();
router.use(requireAuth);

router.get("/:uploadId", async (req, res) => {
  const { uploadId } = req.params;
  const events = await query(
    "SELECT id, ts, src_ip, dest_host, method, path, status, bytes, raw FROM events WHERE upload_id = $1 ORDER BY ts ASC",
    [uploadId]
  );
  const anomalies = await query(
    "SELECT id, event_id, rule, explanation, confidence, created_at FROM anomalies WHERE upload_id = $1 ORDER BY created_at ASC",
    [uploadId]
  );
  const normalizedEvents = events.rows.map((row: any) => ({
    ts: row.ts,
    srcIp: row.src_ip,
    destHost: row.dest_host,
    method: row.method,
    path: row.path,
    status: row.status,
    bytes: row.bytes,
    raw: row.raw
  }));

  const timeline = buildTimeline(normalizedEvents);
  const stats = buildSummary(normalizedEvents);

  return res.json({
    uploadId,
    events: events.rows,
    anomalies: anomalies.rows,
    timeline,
    stats
  });
});

export default router;
