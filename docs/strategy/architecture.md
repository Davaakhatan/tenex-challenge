# Architecture

## High-Level
- Frontend: Next.js (TypeScript) for UI, auth flows, upload form, and results dashboard.
- Backend: Node.js + Express REST API for uploads, parsing, analysis, and data access.
- DB: PostgreSQL for users, uploads, parsed events, anomalies, summaries.
- Storage: local filesystem for uploaded logs (path recorded in DB).

## Why This Architecture
- Separates UI and processing concerns.
- Express satisfies the backend framework requirement.
- Next.js provides a fast, modern UI with minimal setup.
- PostgreSQL gives structured querying for timeline/anomaly views.

## Request Flow
1. User logs in (session/JWT).
2. User uploads a log file to the API.
3. API stores file and creates upload record.
4. API parses log into events and runs anomaly detection.
5. API stores events, anomalies, and summary.
6. UI fetches analysis results and renders table + timeline.

## Components
- Web: Next.js app (App Router).
- API: Express server with routes: /auth, /uploads, /analysis.
- Parser: streaming parser per selected log format.
- Analyzer: heuristic anomaly detector + optional LLM summarizer.

## Non-Goals
- Multi-tenant RBAC.
- Long-running background queues.
- Complex streaming ingestion.
