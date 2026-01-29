# Epic 02 - Upload and Parse

## Goal
Upload log files and parse them into structured events.

## Scope
- Upload endpoint (multipart)
- File storage (local dir)
- Parser for chosen log format
- Events persisted to DB

## Acceptance Criteria
- Upload succeeds for a sample log file.
- Parsed events are queryable.
- Parsing errors are surfaced in response/status.
