import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { parseLogWithStats } from "../services/parser";
import { detectAnomalies } from "../services/anomaly";
import { withTransaction } from "../db";
import { buildTimeline } from "../services/timeline";
import { requireAuth } from "../middleware/auth";
import { buildSummary } from "../services/summary";

const router = Router();
router.use(requireAuth);

const storageDir = process.env.STORAGE_DIR ?? "./storage";
const upload = multer({ dest: storageDir });
const maxSizeBytes = 5 * 1024 * 1024;
const allowedExt = new Set([".log", ".txt"]);

router.get("/", async (_req, res) => {
  const result = await withTransaction(async (client) => {
    const uploads = await client.query(
      `SELECT u.id, u.filename, u.status, u.created_at,
              COALESCE(e.cnt, 0) AS events_count,
              COALESCE(a.cnt, 0) AS anomalies_count
       FROM uploads u
       LEFT JOIN (SELECT upload_id, COUNT(*) cnt FROM events GROUP BY upload_id) e
         ON e.upload_id = u.id
       LEFT JOIN (SELECT upload_id, COUNT(*) cnt FROM anomalies GROUP BY upload_id) a
         ON a.upload_id = u.id
       ORDER BY u.created_at DESC
       LIMIT 25`
    );
    return uploads.rows;
  });

  return res.json({ uploads: result });
});

router.delete("/:uploadId", async (req, res) => {
  const { uploadId } = req.params;
  await withTransaction(async (client) => {
    await client.query("DELETE FROM uploads WHERE id = $1", [uploadId]);
  });
  return res.json({ ok: true });
});

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Missing file" });
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExt.has(ext)) {
    return res.status(400).json({ error: "Invalid file type. Use .log or .txt" });
  }
  if (file.size > maxSizeBytes) {
    return res.status(400).json({ error: "File too large (max 5MB)" });
  }

  const fullPath = path.resolve(file.path);
  let content = "";
  try {
    content = await fs.readFile(fullPath, "utf-8");
  } catch {
    return res.status(500).json({ error: "Failed to read uploaded file" });
  }

  const { events, summary } = parseLogWithStats(content);
  const anomalies = detectAnomalies(events);
  const timeline = buildTimeline(events);
  const stats = buildSummary(events);
  const warnings = summary.invalidLines > 0 ? ["Some lines failed to parse"] : [];

  const uploadId = await withTransaction(async (client) => {
    const uploadResult = await client.query<{ id: string }>(
      "INSERT INTO uploads (filename, storage_path, size_bytes, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [file.originalname, fullPath, file.size, summary.parsedLines > 0 ? "parsed" : "failed"]
    );
    const id = uploadResult.rows[0]?.id;
    if (!id) throw new Error("Upload insert failed");

    const eventIdMap = new WeakMap<object, string>();
    for (const evt of events) {
      const eventRes = await client.query<{ id: string }>(
        "INSERT INTO events (upload_id, ts, src_ip, dest_host, method, path, status, bytes, raw) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
        [id, evt.ts, evt.srcIp, evt.destHost, evt.method, evt.path, evt.status, evt.bytes, evt.raw]
      );
      if (eventRes.rows[0]?.id) eventIdMap.set(evt, eventRes.rows[0].id);
    }

    for (const anomaly of anomalies) {
      const eventId = anomaly.event ? eventIdMap.get(anomaly.event) ?? null : null;
      await client.query(
        "INSERT INTO anomalies (upload_id, event_id, rule, explanation, confidence) VALUES ($1,$2,$3,$4,$5)",
        [id, eventId, anomaly.rule, anomaly.explanation, anomaly.confidence]
      );
    }

    return id;
  });

  return res.json({
    upload: {
      id: uploadId,
      filename: file.originalname,
      storagePath: fullPath,
      size: file.size
    },
    summary,
    warnings,
    events,
    anomalies,
    timeline,
    stats
  });
});

export default router;
