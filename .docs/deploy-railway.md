# Deploy Ototabi on Railway + Vercel

Split production layout:

| Platform | Service                                                  |
| -------- | -------------------------------------------------------- |
| Vercel   | `apps/client` (Next.js)                                  |
| Railway  | `apps/api`, `apps/worker`, Postgres plugin, Redis plugin |
| External | S3-compatible object storage (R2, AWS S3, or MinIO)      |

## 1. Railway project

1. Create a Railway project and link this repository.
2. Add **Postgres** and **Redis** plugins.
3. Create two services from Dockerfiles (build context = **repo root**):
   - API: `apps/api/Dockerfile`, enable public networking, health check path `/health` if configured.
   - Worker: `apps/worker/Dockerfile`, disable public HTTP.

## 2. Shared environment (API + worker)

| Variable             | Source                                 |
| -------------------- | -------------------------------------- |
| `DATABASE_URL`       | Postgres plugin reference              |
| `REDIS_URL`          | Redis plugin reference                 |
| `BETTER_AUTH_SECRET` | Manual secret                          |
| `BETTER_AUTH_URL`    | **Vercel client URL** (browser origin) |
| `FRONTEND_URL`       | Vercel production + preview URLs       |
| `ALLOWED_ORIGINS`    | Comma-separated Vercel origins         |
| `LIVEKIT_*`          | LiveKit Cloud                          |
| `AWS_*` / S3         | Object storage                         |
| `OPENAI_API_KEY`     | Whisper + LLM + clips                  |
| `PORT`               | Railway injects on API service         |

Run migrations once:

```bash
railway run bun run db:deploy
```

## 3. Vercel client

- Root Directory: `apps/client`
- `NEXT_PUBLIC_API_URL` = Railway API public URL
- `NEXT_PUBLIC_APP_URL` = Vercel URL
- Build uses `apps/client/vercel.json` (Turbo filter for client only)

## 4. Cross-origin auth checklist

- `BETTER_AUTH_URL` = Vercel origin (not Railway API host)
- `NEXT_PUBLIC_API_URL` = Railway API origin
- API `FRONTEND_URL` + `ALLOWED_ORIGINS` include all Vercel preview domains
- Test sign-in → dashboard → tRPC from production client URL

## 5. Smoke test

1. Auth sign-in on Vercel URL
2. Dashboard loads `dashboard.getSummary`
3. Record in studio → stop → worker logs transcript + LLM + clips
4. `/recordings/{sessionId}` shows transcript, show notes, clip candidates
5. Recovery console resumes pending chunks after tab kill
