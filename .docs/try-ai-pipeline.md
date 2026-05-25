# Try the AI + worker pipeline (local smoke)

Prerequisites: PostgreSQL, Redis, MinIO (or S3), `OPENAI_API_KEY`, and **ffmpeg** on the worker host.

## 1. Infrastructure

```bash
# From repo root — adjust if you use docker-compose elsewhere
export REDIS_URL=redis://localhost:6379
export DATABASE_URL=postgresql://...
export OPENAI_API_KEY=sk-...
# MinIO / S3 (see .env.example)
export MINIO_ENDPOINT=http://localhost:9000
export MINIO_ACCESS_KEY=...
export MINIO_SECRET_KEY=...
export MINIO_BUCKET_NAME=ototabi
```

```bash
bun run db:migrate   # runs prisma migrate deploy
```

## 2. Start services

Terminal A — API + client (your usual dev command):

```bash
bun run dev
```

Terminal B — BullMQ worker:

```bash
cd apps/worker && bun run dev
```

Worker queues: `transcript` → `llm` → `clips`, and `export` for 9:16 renders.

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
5. **9:16 render**: click **Queue 9:16 export** on a clip. Worker runs ffmpeg (trim + scale/pad to 1080×1920), uploads MP4 to S3, sets `renderStatus: ready`.
6. **Download**: when ready, use **Download 9:16** on session review or export console.

## 4. Troubleshooting

| Symptom                     | Check                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| No transcript               | `OPENAI_API_KEY`, worker logs, Redis connected, mic track `COMPLETED` with `s3Key` |
| Transcript stuck after stop | Upload finished? `scheduleTranscriptIfReady` runs on mic `completeUpload`          |
| No clips                    | Transcript must exist; LLM job must complete (see worker `[LLM]` logs)             |
| Export stays processing     | Worker running? `ffmpeg -version` in worker container; S3 credentials              |
| Export failed               | Worker log for ffmpeg exit code; source track must be uploaded                     |

## 5. Verification commands

```bash
bun fmt && bun lint && bun typecheck && bun run test
```
