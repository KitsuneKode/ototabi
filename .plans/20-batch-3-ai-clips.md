# Batch 3 — AI Hardening + Magic Clips

**Goal:** Reliable transcript pipeline, surface AI on dashboard/review, clip candidates + vertical export queue.

## Tasks

- [x] Re-queue transcript when mic upload completes (`uploads.service`)
- [x] Transcript worker resolves empty `audioTrackS3Key` from DB
- [x] `sessionReview` bundle: `showNotes`, `clipCandidates`, `aiStatus`
- [x] `dashboard.getSummary` AI badges
- [x] `ClipCandidate` schema + clips worker + `clips` tRPC router
- [x] Hybrid export worker job (`export` queue) marks 9:16 renders

## Verification

```bash
bun fmt && bun lint && bun typecheck && bun run test
```
