import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { parseLog } from "../services/parser";
import { detectAnomalies } from "../services/anomaly";
import { withTransaction } from "../db";
import { buildTimeline } from "../services/timeline";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const storageDir = process.env.STORAGE_DIR ?? "./storage";
const upload = multer({ dest: storageDir });

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Missing file" });

  const fullPath = path.resolve(file.path);
  const content = await fs.readFile(fullPath, "utf-8");
  const events = parseLog(content);
  const anomalies = detectAnomalies(events);
  const timeline = buildTimeline(events);

  const uploadId = await withTransaction(async (client) => {
    const uploadResult = await client.query<{ id: string }>(
      "INSERT INTO uploads (filename, storage_path, size_bytes) VALUES ($1, $2, $3) RETURNING id",
      [file.originalname, fullPath, file.size]
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
    events,
    anomalies,
    timeline
  });
});

export default router;
