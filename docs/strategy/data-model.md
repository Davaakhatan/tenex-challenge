# Data Model

## Tables (Minimal)
- users
  - id, email, password_hash, created_at
- uploads
  - id, user_id, filename, storage_path, status, created_at
- events
  - id, upload_id, ts, src_ip, dest_host, method, path, status, bytes, raw
- anomalies
  - id, upload_id, event_id (nullable), rule, explanation, confidence, created_at
- summaries
  - id, upload_id, timeline_json, notes

## Notes
- Keep events minimal to support timeline and anomaly rules.
- raw column retains original line for traceability.
