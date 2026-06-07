# Local smoke — full Creator Suite path

Run on **localhost** after `bun dev` + `docker compose up -d` + `bun run db:migrate`. No production deploy required.

## Prerequisites

| Check     | Command / URL                                                                           |
| --------- | --------------------------------------------------------------------------------------- |
| Infra up  | `docker compose ps` (Postgres, MinIO, Redis healthy)                                    |
| Env       | Root `.env` from `.env.example` — see [quick-start.md](./quick-start.md) checklist      |
| Processes | `bun dev` → client `:3000`, API `:8080`, worker                                         |
| CI parity | `bun run check` and `NODE_ENV=production bunx turbo run build --filter=@ototabi/client` |

## 1. Auth + dashboard

1. Open http://localhost:3000 → sign up / sign in.
2. Dashboard loads; PWR/SYNC LEDs in header (marketing) or sidebar lockup (app).

## 2. Studio record + upload

1. Create room → open studio (`/chat/{code}`).
2. Start recording → speak 10–20s → stop.
3. During upload, studio LEDs / progress use **part-level** counts (`uploadedParts` / `totalParts`) — progress should not hit 100% until all parts are on S3.
4. Wait for mic track **COMPLETED** on `/recordings/{sessionId}` (upload to MinIO if S3 env set).

**Upload pool:** concurrent part uploads per track (see `apps/client/lib/uploader/upload-worker-pool.ts`). After stop, the pool drains remaining chunks before `complete()` runs.

## 2b. Studio lock & admit (optional)

1. Room host → `/rooms/{roomId}/settings` → **Studio Gate** → enable **Lock**.
2. Guest signs in → tries studio join → should see waiting / denied until host **Admits** (or guest is already a room member).
3. LiveKit token path consumes invite when applicable (`enterStudio` / `enterStudioForLiveKit`).

## 3. Recovery (optional)

Follow [try-recovery-smoke.md](./try-recovery-smoke.md) if testing tab-kill recovery.

## 4. AI pipeline

Requires `OPENAI_API_KEY` + `REDIS_URL`. See [try-ai-pipeline.md](./try-ai-pipeline.md).

1. On `/recordings/{sessionId}`, **pipeline** block shows `transcript` / `llm` / `clips` each as `pending` → `processing` → `ready` or `failed` (with error text when failed).
2. Transcript segments appear when transcript is `ready`.
3. **Regenerate clips** if empty; wait for clip candidates.
4. **Queue 9:16 export** per clip → status `processing` → `ready` (worker throws on hard failures so BullMQ can retry).
5. **Download 9:16** when ready.
6. **Reels preset** (after base render ready): pick `bold-captions` or `minimal-lower-third` → re-render → download.

## 5. Session exports

On session review / export page:

- Queue **landscape 16:9** and **episode MP3** when tracks are complete.
- Retry transcript if failed (when exposed in UI).

## 5b. Export bundles

On `/recordings/{sessionId}` or `/export/{sessionId}` → **Export bundle**:

1. **List exportable assets** — tracks, transcript, clips, session renders (only `ready` items are selectable).
2. Select assets → **Download ZIP** or individual URLs from `createExportBundle`.
3. Presets **All tracks** / **Post-production** when offered in the picker.

## 6. Demo mode

1. `/demo` → record short screen capture.
2. `/demo/{sessionId}/edit` → **Suggest zoom from cursor** → export.

## 7. Export console — timeline, text cuts, trim

On `/export/{sessionId}` with at least one **COMPLETED** track:

1. **Timeline & preview** — scrub the global rail; playhead moves on lanes and in the preview video. Click a lane to make it active, then drag **trim in/out** handles; values sync to **Trim clip** fields.
2. **Text cuts (Pro+)** — mark transcript segments, confirm preview stats/highlight, apply cuts (multi-track when multiple sources selected).
3. **Sync warnings** — sparse or missing sync markers show alignment warnings before merge/export.

## Smoke log checklist

Use this for local and staging sign-off. Record date, env, host account, guest account, room/session ID, and any defects.

- [ ] Host signs in.
- [ ] Host creates room.
- [ ] Guest joins by invite link.
- [ ] Preflight runs.
- [ ] Consent is acknowledged before recording.
- [ ] Host starts recording.
- [ ] Tracks upload.
- [ ] Transcript queues or returns plan-upgrade state truthfully.
- [ ] Clips render or return plan-upgrade state truthfully.
- [ ] Export bundle downloads.
- [ ] Recovery page shows no stranded chunks after success.

## Pass criteria

- No console errors on happy path.
- `bun run check` passes on your branch.
- Clips render without worker ffmpeg errors (ffmpeg on PATH for worker).
