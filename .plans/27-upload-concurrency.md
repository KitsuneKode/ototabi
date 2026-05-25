# Plan 27: Concurrent multipart upload (during + after recording)

**Status:** pending  
**Priority:** P0 (trust / Riverside parity)  
**Parent:** [Plan 02](02-local-recording-opfs-recovery.md), [Plan 13](13-riverside-competitive-roadmap.md)

## Problem

Today `RecorderManager.processUploadQueue()` uploads **one chunk per tick** (`query.first()`, 1.5s interval). After stop, `completeProcessing()` drains with up to 50 sequential passes. Long sessions can leave **tens of minutes** of upload work _after_ the user thinks recording is done.

That violates the product promise: local capture is immediate; cloud backup should keep pace during the session.

## Target behavior

| Phase                | Behavior                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **During recording** | Upload parts concurrently (configurable parallelism, e.g. 3–4 per track) while new chunks are written to OPFS/IDB |
| **After stop**       | Finish remaining parts with same pool; show honest “uploading N/M parts” not a fake 100%                          |
| **Across tracks**    | Optional cap on total in-flight PUTs (e.g. 6) to avoid saturating home uplink                                     |
| **Recovery**         | Resume skips completed part numbers (already via `listParts`)                                                     |

## Implementation sketch

- Replace single-chunk `processUploadQueue` with a **worker pool** + in-flight set keyed by `chunkId`
- `completeProcessing`: `await drainUploadPool()` instead of 50× one-chunk loop
- UI: session review + studio LEDs reflect part-level progress (extend upload progress map)
- Policy: backoff on 503/rate limit; do not starve LiveKit data channel

## Acceptance

- 30‑min mock session: majority of parts uploaded before stop; post-stop drain &lt; 2× realtime upload estimate on typical broadband
- Tab-kill mid-upload → recovery still completes missing parts
- `bun run check` + upload policy tests pass

## Non-goals

- Changing chunk size (still ~4s unless separate experiment)
- Server-side multipart from browser without presigned PUTs
