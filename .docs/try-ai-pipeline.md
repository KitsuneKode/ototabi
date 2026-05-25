# Try the AI + worker pipeline (local smoke)

Prerequisites: PostgreSQL, Redis, MinIO (or S3), `OPENAI_API_KEY`, and **ffmpeg** on the worker host.

## 1. Infrastructure

```bash
docker compose up -d
cp .env.example .env   # if you have not already
# Edit .env: DATABASE_URL, OPENAI_API_KEY, LiveKit, and S3 vars (see .docs/quick-start.md)
bun run db:migrate       # prisma migrate deploy
```

Use the same S3 bucket name as `docker-compose` init: **`ototabi-recordings`** (`AWS_S3_BUCKET_NAME` in `.env.example`).

## 2. Start services

From repo root (Turbo runs **client**, **api**, and **worker** together):

```bash
bun dev
```

Install **ffmpeg** on your machine for 9:16 export jobs (`ffmpeg -version`). Worker logs will fail export jobs without it.

Worker-only terminal (optional, if you filtered Turbo):

```bash
cd apps/worker && bun run dev
```

Queues: `transcript` → `llm` → `clips`, and `export` for 9:16 clips plus full-session MP3 / 16:9.

Docker worker (includes ffmpeg):

```bash
docker build -f apps/worker/Dockerfile -t ototabi-worker .
docker run --env-file .env ototabi-worker
```

## 3. Smoke flow

1. Sign in, create/join a room, record with **camera or mic**, stop session.
2. Wait for uploads to complete (dashboard / session review shows tracks uploaded).
3. **Transcript**: queued on stop (or after mic upload completes). Poll session review — AI status moves to ready when transcript + show notes/clips appear (~30s–2m with API key).
4. **Clips**: generated automatically after LLM job; appear under “Vertical clip pack” on session review.
5. **9:16 render**: click **Queue 9:16 export** on a clip. Worker runs ffmpeg (trim + scale/pad to 1080×1920), uploads MP4 to S3, sets `renderStatus: ready`. On failure, `renderError` appears with **Retry**.
6. **Full-session exports**: queue **Episode MP3** or **Landscape 16:9** on session review / export console (`sessionReview.queueSessionExport`).
7. **Transcript retry**: after mic upload completes (auto) or **Retry transcript** when `transcriptStatus` is not `ready`.
8. **Download**: use download buttons when `renderStatus` / `exports.*.status` is `ready`.

## 4. Troubleshooting

| Symptom                     | Check                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| No transcript               | `OPENAI_API_KEY`, worker logs, Redis connected, mic track `COMPLETED` with `s3Key` |
| Transcript stuck after stop | Upload finished? `scheduleTranscriptIfReady` runs on mic `completeUpload`          |
| No clips                    | Transcript must exist; LLM job must complete (see worker `[LLM]` logs)             |
| Export stays processing     | Worker running? `ffmpeg -version` in worker container; S3 credentials              |
| Export failed               | UI shows `renderError` / `exports.*.error`; worker log; source track uploaded      |
| Transcript retry            | `sessionReview.retryTranscript` or mic upload complete; Redis + worker running     |

## 5. Verification commands

```bash
bun run check   # fmt:check + lint + typecheck + test
```
