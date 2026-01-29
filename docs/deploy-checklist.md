# Deployment Checklist (Vercel + Render + Neon)

## Neon (DB)
- Create project + database
- Copy DATABASE_URL
- Run schema: `psql $DATABASE_URL -f api/sql/schema.sql`

## Render (API)
- New Web Service from repo (root: `api`)
- Build: `npm install`
- Start: `npm run start`
- Env:
  - DATABASE_URL
  - JWT_SECRET
  - STORAGE_DIR=/tmp/storage
  - CORS_ORIGIN=https://<vercel-app>
- Confirm `GET /health`

## Vercel (Web)
- Import repo (root: `web`)
- Env:
  - NEXT_PUBLIC_API_URL=https://<render-api>
- Deploy

## Verify
- Login
- Upload sample log
- Open results and confirm anomalies
