# Interview Notes

## 5–7 Minute Walkthrough
1. **Problem framing**: ingest logs, parse into events, summarize timeline, detect anomalies.
2. **Architecture**: Next.js UI + Express API + Postgres; separation for clarity.
3. **Data model**: uploads → events → anomalies; why these tables exist.
4. **Log format**: fixed fields to keep parser deterministic.
5. **Anomaly detection**: burst, error ratio, rare destination, large transfer; explain confidence.
6. **UI**: show timeline + anomalies + event table highlight.
7. **Next steps**: background processing, richer parsers, user management.

## System-Design Talking Points
- Why REST instead of direct DB? clear boundaries.
- How to scale: background jobs, object storage, streaming parse.
- Security: auth, file validation, least privilege.
- Observability: upload status, parse warnings, summary metrics.

## Collaborative Coding Readiness
- Be explicit about assumptions.
- Start with a small working slice, then iterate.
