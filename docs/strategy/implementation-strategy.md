# Implementation Strategy

## Phases
1. Foundations
   - Repo structure, environment config, DB schema.
   - Auth flow (basic login) and API skeleton.
2. Ingestion
   - Upload API (multipart), file storage.
   - Log parser and event normalization.
3. Analysis
   - Heuristic anomaly detection.
   - Summary and timeline derivation.
4. UI
   - Login, upload, results (table + timeline).
   - Highlight anomalies and show explanations.
5. Polish
   - Error handling, sample logs, README.

## Log Format Choice
- Pick one format and document it in README.
- Provide a sample log file in /examples.

## Minimal End-to-End Path
- Login -> Upload -> Parse -> Store -> Fetch -> Display.

## Testing
- Unit tests for parser/anomaly functions.
- API integration test for upload + analysis.
