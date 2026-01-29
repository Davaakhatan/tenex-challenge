# AI / Anomaly Detection Strategy

## Goals
- Identify unusual patterns for SOC-style review.
- Provide explanation and confidence score per anomaly.

## Baseline Heuristics
- Burst from single IP within short window.
- Access to rare destination domains.
- High error rates (4xx/5xx) from a source.
- Large byte transfer outliers.

## Confidence Scoring
- Score 0–1 based on rule strength and rarity.
- Example: z-score on request counts or bytes.

## Optional LLM Usage
- Summarize timeline and top anomalies.
- Generate human-friendly explanations.

## Documentation Requirement
- Clearly note where LLM is used (or not) in README.
