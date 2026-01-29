# Memory Bank

## Product Summary
A full-stack cybersecurity web app that lets authenticated users upload log files, parses them, and displays human-consumable insights including a timeline of events. Bonus: anomaly detection with explanations and confidence scores.

## Scope
- Upload log files (.txt/.log) and persist them.
- Parse logs into structured events.
- Summarize results (table + timeline).
- Detect anomalies and highlight them with reasons and confidence.
- Basic authentication.
- REST API backend.
- Local run instructions; optional cloud deploy.

## Constraints
- Prototype focus (6–8 hour take-home).
- Must be explainable end-to-end.
- Use TypeScript and a modern frontend framework (Next.js preferred).
- Backend using Go/Flask/Express (choose one).
- PostgreSQL if a DB is needed.

## Key Decisions
- Frontend: Next.js (App Router), TypeScript, server components for initial render.
- Backend: Node.js + Express REST API (separate service).
- DB: PostgreSQL for users, uploads, parsed events, anomalies.
- Storage: local disk for uploaded files; path stored in DB.
- Processing: streaming parse + heuristic anomaly detection; optional LLM summarization.

## Assumptions
- Single-tenant, small files suitable for synchronous processing.
- Log format chosen and documented (e.g., ZScaler-like or Apache).
- Basic auth can be email/password + JWT or session cookie.

## Open Questions
- Final log format choice and sample files.
- Whether to use LLM for summarization/anomaly explanation.
- Deployment target (Vercel + Render/Fly vs local only).

## Risks
- Parsing variability across log formats.
- Overfitting anomaly heuristics to one sample.
- LLM costs/time if used.
