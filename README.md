# Tenex Log Analyzer (Prototype)

## Overview
Full-stack cybersecurity log analysis app. Users upload log files, the API parses them into events, runs anomaly detection, and the UI displays a table and timeline.

## Local Setup (Manual)
1. Create a Postgres database.
2. Apply schema: `psql $DATABASE_URL -f api/sql/schema.sql`
3. Configure env vars for API and web.
4. Start API and web.

## Demo Credentials
- Email: `demo@tenex.local`
- Password: `password`

## Auth
Login returns a JWT; send it as `Authorization: Bearer <token>` for uploads and analysis.

## Env
- API: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_DIR`
- Web: `NEXT_PUBLIC_API_URL`

## Example Logs
See `examples/`.

## AI Usage
Documented in `docs/strategy/ai-anomaly-detection.md`.
# tenex-challenge
