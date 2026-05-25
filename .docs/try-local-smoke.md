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
3. Wait for mic track **COMPLETED** on `/recordings/{sessionId}` (upload to MinIO if S3 env set).

## 3. Recovery (optional)

Follow [try-recovery-smoke.md](./try-recovery-smoke.md) if testing tab-kill recovery.

## 4. AI pipeline

Requires `OPENAI_API_KEY` + `REDIS_URL`. See [try-ai-pipeline.md](./try-ai-pipeline.md).

1. Transcript segments appear on session review.
2. **Regenerate clips** if empty; wait for clip candidates.
3. **Queue 9:16 export** per clip → status `processing` → `ready`.
4. **Download 9:16** when ready.
5. **Reels preset** (after base render ready): pick `bold-captions` or `minimal-lower-third` → re-render → download.

## 5. Session exports

On session review / export page:

- Queue **landscape 16:9** and **episode MP3** when tracks are complete.
- Retry transcript if failed (when exposed in UI).

## 6. Demo mode

1. `/demo` → record short screen capture.
2. `/demo/{sessionId}/edit` → **Suggest zoom from cursor** → export.

## 7. Text editing (Plan 05)

1. `/export/{sessionId}` → transcript cut mode, preview range, apply cuts (multi-track when multiple sources).

## Pass criteria

- No console errors on happy path.
- `bun run check` passes on your branch.
- Clips render without worker ffmpeg errors (ffmpeg on PATH for worker).
