# Decision 0001: Evaluator Report Schema Enhancements

## Status
Accepted

## Context
Per README.md lines 266-274 (Week 5):
- Rubric scoring requires an evidence quote and a confidence level for each of the 5 rubric dimensions.
- The double-run consistency check flags `needsHumanReview = true` if two runs differ by > 1.
- We need to expose human review reasoning so reviewers understand why an interview was flagged.

## Changes
In `packages/contracts/src/report.ts`:
1. Added `ConfidenceEnum` and `confidence: z.enum(["high", "medium", "low"]).default("high")` to `ScoreEvidenceSchema`.
   - Defaults to `"high"` to maintain full backward compatibility with any previously serialized reports.
2. Added `humanReviewReason: z.string().optional()` to `ReportSchema`.
   - Optional string explaining the dimension discrepancy or review reason.

