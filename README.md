# Tenex Log Analyzer (Prototype)

## Overview
Full-stack cybersecurity log analysis app. Users upload log files, the API parses them into events, runs anomaly detection, and the UI displays a table, timeline, and summary insights.

## Local Setup (Manual)
1. Create a Postgres database.
2. Apply schema: `psql $DATABASE_URL -f api/sql/schema.sql`
3. Configure env vars for API and web.
4. Install deps: `cd api && npm install` and `cd web && npm install`
5. Start API and web: `cd api && npm run dev` and `cd web && npm run dev`
6. (Optional) Run parser test: `cd api && npm run test`

## Local Setup (Docker)
1. `docker compose up --build`
2. Apply schema once: `psql postgresql://postgres:postgres@localhost:5432/tenex -f api/sql/schema.sql`

## Demo Credentials
- Email: `demo@tenex.local`
- Password: `password`

## Auth
Login returns a JWT; send it as `Authorization: Bearer <token>` for uploads and analysis.

## API
- `POST /uploads` -> returns events, anomalies, timeline, summary
- `GET /analysis/:uploadId` -> full analysis
- `GET /analysis/:uploadId/summary` -> summary only

## Env
- API: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_DIR`, `CORS_ORIGIN` (comma-separated allowed origins or `*`)
- Web: `NEXT_PUBLIC_API_URL`

## Example Logs
See `examples/`.

## Log Format
Each line must follow:
`ISO_TIMESTAMP SRC_IP METHOD HOST PATH STATUS BYTES`

Example:
`2026-01-29T10:00:00Z 10.0.0.1 GET example.com /login 200 512`

## Supported Formats
- Custom format above
- Apache access logs
- Nginx access logs
- Squid proxy access logs
- Zscaler-like CSV logs
- JSON app logs (one JSON per line)
- Syslog with key=value payload
- Key=value app logs

## Upload Limits
- Max file size: 5MB
- Allowed extensions: .log, .txt

## AI / Anomaly Detection
This prototype uses an AI-based statistical anomaly model (z-score scoring) plus contextual rules. It flags outliers in per-IP request volume and transfer sizes, then layers in burst and error-rate heuristics. Each anomaly includes a confidence score derived from the model. See `docs/strategy/ai-anomaly-detection.md`.

## Deployment (Vercel + Render + Neon)

### 1) Neon (Postgres)
1. Create a Neon project and database.
2. Copy the connection string (DATABASE_URL).
3. Run the schema once locally against Neon:
   `psql $DATABASE_URL -f api/sql/schema.sql`

### 2) Render (API)
1. Create a new **Web Service** from the `api` folder.
2. Build command: `npm install`
3. Start command: `npm run start`
4. Set env vars:
   - `DATABASE_URL` = Neon connection string
   - `JWT_SECRET` = random secret
   - `STORAGE_DIR` = `/tmp/storage`
   - `CORS_ORIGIN` = your Vercel domain (e.g., `https://your-app.vercel.app`)

### 3) Vercel (Web)
1. Import the `web` folder as a Vercel project.
2. Set env:
   - `NEXT_PUBLIC_API_URL` = Render API URL (e.g., `https://your-api.onrender.com`)
3. Deploy.

### Notes
- After deploying, verify `/health` on the API URL.
- Update `CORS_ORIGIN` if you add custom domains.

## Anomaly Rules (Heuristic)
- Burst requests from a single IP within 3 seconds.
- High error ratio from a single IP.
- Rare destination host within the file.
- Large transfer size outliers.
