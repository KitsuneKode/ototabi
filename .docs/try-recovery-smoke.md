# Recovery smoke (tab-kill + retry upload)

Manual check for Plan 13 / Batch 0 trust. Run with `bun dev` (client `:3000`, API `:8080`) and MinIO/S3 configured.

## Prerequisites

- Signed-in host account
- Room with invite link (for guest tests, optional)
- DevTools → Application → Storage visible (IndexedDB + OPFS)

## Steps

1. **Start recording** — Host opens studio (`/chat/{roomCode}`), starts a session, records ≥10s, then **Stop**.
2. **Mid-upload tab kill** — Start another short recording; while upload progress is &lt;100%, hard-close the tab (or `about:blank` + close).
3. **Recovery console** — Reopen app → **Recovery** (`/recovery`).
   - Expect at least one pending track with chunk count &gt;0.
   - OPFS usage line shows files &gt;0 when chunks were dual-written.
4. **Retry upload** — Click **RETRY UPLOAD**; wait until track disappears from the list.
5. **Server verify** — Open session review / export for that `sessionId`; mic (or camera) track shows **COMPLETED** with `s3Key`.
6. **Export sync** — On export page with 2+ completed tracks:
   - With sync markers: baseline ms label appears under Session Timeline.
   - Without markers: amber warning about multi-track phase alignment.

## Pass criteria

- No stuck `uploading` chunks in IndexedDB after successful retry
- OPFS chunk count drops for that track after completion
- Guest cannot call `uploads.complete` for another user's `uploadId` (403 in Network tab if attempted)
- LiveKit `/api/token` returns 403 without room membership or valid invite

## Cross-user upload deny (API)

In DevTools console (while logged in as user B), attempting signed URLs for user A's `key` + `uploadId` should return tRPC `FORBIDDEN`.
