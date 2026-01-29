import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/uploads";
import analysisRoutes from "./routes/analysis";
import fs from "node:fs/promises";

const app = express();
const storageDir = process.env.STORAGE_DIR ?? "./storage";

const rawOrigins = process.env.CORS_ORIGIN ?? "*";
const allowAll = rawOrigins === "*";
const allowList = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, ok?: boolean) => void) => {
    if (allowAll) return callback(null, true);
    if (!origin) return callback(null, true);
    return callback(null, allowList.includes(origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/uploads", uploadRoutes);
app.use("/analysis", analysisRoutes);

const port = Number(process.env.PORT ?? 4000);
fs.mkdir(storageDir, { recursive: true })
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on :${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to create storage directory", err);
    process.exit(1);
  });
