# Tenex Log Analyzer (Prototype)

## Overview
Full-stack cybersecurity log analysis app. Users upload log files, the API parses them into events, runs anomaly detection, and the UI displays a table and timeline.

## Local Setup (Manual)
1. Create a Postgres database.
2. Apply schema: `psql $DATABASE_URL -f api/sql/schema.sql`
3. Configure env vars for API and web.
4. Start API and web.
5. (Optional) Run parser test: `cd api && npm run test`

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
- API: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_DIR`
- Web: `NEXT_PUBLIC_API_URL`

## Example Logs
See `examples/`.

## Log Format
Each line must follow:
`ISO_TIMESTAMP SRC_IP METHOD HOST PATH STATUS BYTES`

Example:
`2026-01-29T10:00:00Z 10.0.0.1 GET example.com /login 200 512`

## Upload Limits
- Max file size: 5MB
- Allowed extensions: .log, .txt

## AI Usage
Documented in `docs/strategy/ai-anomaly-detection.md`.

## Anomaly Rules (Heuristic)
- Burst requests from a single IP within 3 seconds.
- High error ratio from a single IP.
- Rare destination host within the file.
- Large transfer size outliers.
# tenex-challenge
