# Deploy Ototabi on Railway + Vercel

Split production layout:

| Platform | Service                                                  |
| -------- | -------------------------------------------------------- |
| Vercel   | `apps/client` (Next.js)                                  |
| Railway  | `apps/api`, `apps/worker`, Postgres plugin, Redis plugin |
| External | S3-compatible object storage (R2, AWS S3, or MinIO)      |

---

## Staging quick reference

Use this matrix when wiring **one** staging slice (Vercel Preview + Railway API/worker). Replace placeholders with your real URLs.

| Variable              | Set on               | Example (staging)                                                                      |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `BETTER_AUTH_URL`     | Railway API + worker | `https://ototabi-client-xxx.vercel.app`                                                |
| `FRONTEND_URL`        | Railway API + worker | Same as `BETTER_AUTH_URL` (primary Vercel origin)                                      |
| `ALLOWED_ORIGINS`     | Railway API + worker | `https://ototabi-client-xxx.vercel.app,https://ototabi-client-git-feat-xxx.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Vercel client        | `https://ototabi-api-production.up.railway.app`                                        |
| `NEXT_PUBLIC_APP_URL` | Vercel client        | Same as `BETTER_AUTH_URL`                                                              |
| `DATABASE_URL`        | Railway API + worker | Postgres plugin reference                                                              |
| `REDIS_URL`           | Railway API + worker | Redis plugin reference                                                                 |
| `BETTER_AUTH_SECRET`  | Railway API + worker | Long random secret (same value on both)                                                |

**Rules**

- `BETTER_AUTH_URL` is always the **browser origin** (Vercel), never the Railway API host.
- `NEXT_PUBLIC_API_URL` is always the **Railway API public URL** (tRPC + uploads + LiveKit token routes).
- List every Vercel preview hostname you use in `ALLOWED_ORIGINS` (comma-separated, no trailing slashes).

---

## 1. Railway project

1. Create a Railway project and link this repository.
2. Add **Postgres** and **Redis** plugins.
3. Create two services from Dockerfiles (build context = **repo root**):
   - **API:** `apps/api/Dockerfile`, enable public networking, set health check to `/health` if exposed.
   - **Worker:** `apps/worker/Dockerfile`, no public HTTP.
4. On **both** API and worker services, paste the shared env block from the matrix above (plus LiveKit, S3, `OPENAI_API_KEY` as needed).

### Migrations (staging or production)

From a machine with Railway CLI linked to the project:

```bash
railway link
railway run bun run db:deploy
```

Confirm `prisma migrate deploy` completes without error before smoke tests.

---

## 2. Vercel client (staging preview)

1. Import repo; set **Root Directory** to `apps/client`.
2. Build/install commands come from `apps/client/vercel.json` (monorepo root `bun install` + `turbo run build --filter=@ototabi/client`).
3. Environment (Preview scope is enough for staging):

| Variable                  | Value                                               |
| ------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`     | Railway API public URL                              |
| `NEXT_PUBLIC_APP_URL`     | This deployment's Vercel URL (or fixed preview URL) |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit Cloud WSS URL                               |

4. Redeploy after changing any `NEXT_PUBLIC_*` variable (baked at build time).

---

## 3. Cross-origin auth checklist

Before calling staging "ready", verify:

- [ ] `BETTER_AUTH_URL` on Railway = Vercel origin (scheme + host, no path).
- [ ] `NEXT_PUBLIC_API_URL` on Vercel = Railway API origin (browser calls API cross-origin).
- [ ] `FRONTEND_URL` matches primary Vercel URL; `ALLOWED_ORIGINS` includes preview branch URLs.
- [ ] `packages/auth` `trustedOrigins` receives the same origins via `FRONTEND_URL` + `ALLOWED_ORIGINS` (no code change if env is correct).
- [ ] API CORS (`apps/api/src/app.ts`) allows the same origins.
- [ ] Sign-in on Vercel URL → session cookie present → `dashboard.getSummary` via tRPC succeeds.

OAuth providers (GitHub/Google): add the Vercel callback URL in the provider console when enabling social login.

---

## 4. Parity v1 staging checklist (Riverside milestone)

Use after merging Waves 1–5 (usage caps, studio trust, health, export polish, demo v1.1, worker export, timeline MVP, AI regen). **Do not deploy** until Railway + Vercel credentials exist.

### Pre-deploy

- [ ] `bun run check` green on integration branch (`feat/parity-stream8-wave5` or merged `integration/parity-v1`)
- [ ] `railway run bun run db:deploy` against staging Postgres
- [ ] API + worker share: `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`
- [ ] Worker: `OPENAI_API_KEY` (AI path), S3/R2 keys, LiveKit keys if testing studio
- [ ] Optional billing: `DODO_PAYMENTS_API_KEY` + product IDs for plan-gate smoke

### Vercel preview

- [ ] `NEXT_PUBLIC_API_URL` → Railway API public URL
- [ ] `NEXT_PUBLIC_APP_URL` → this preview origin
- [ ] `NEXT_PUBLIC_LIVEKIT_URL` → LiveKit WSS (studio smoke)
- [ ] Redeploy client after any `NEXT_PUBLIC_*` change

### Post-deploy smoke URLs

| Step    | Route                         | Pass criteria                                                                               |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Auth    | `/auth` → sign-in             | Session cookie; dashboard loads                                                             |
| Studio  | `/chat/{roomId}` or preflight | Preflight warn path; short record + upload                                                  |
| Review  | `/recordings/{sessionId}`     | Pipeline rail; regen buttons; editable show notes                                           |
| Export  | `/export/{sessionId}`         | Timeline scrub; Pro cut gate; clip regen                                                    |
| Billing | Trial host                    | 2nd transcript blocked; export cut CTA (see [try-billing-smoke.md](./try-billing-smoke.md)) |
| AI      | Worker logs                   | transcript → LLM → clips ([try-ai-pipeline.md](./try-ai-pipeline.md))                       |

### Optional E2E (Phase 2)

Scaffold: `e2e/` — run manually with `PLAYWRIGHT_BASE_URL` set to the Vercel preview URL (see `e2e/README.md`). Not part of CI gate yet.

---

## 5. Operator smoke test (staging)

Run in order; stop on first failure and fix env before continuing.

1. **API health** — `curl -fsS "$RAILWAY_API_URL/health"` (or your health route).
2. **Auth** — Open Vercel URL → sign up / sign in → land on dashboard without CORS or cookie errors (browser devtools → Network: `/api/trpc` and auth calls go to Railway API).
3. **Dashboard** — `dashboard.getSummary` returns data (proves tRPC + DB).
4. **Studio path** — Create/join room → short record → stop → session appears under recordings.
5. **AI path** (if `OPENAI_API_KEY` set) — Worker logs show transcript → LLM → clips; `/recordings/{sessionId}` shows transcript and clip actions ([`.docs/try-ai-pipeline.md`](try-ai-pipeline.md)).
6. **Recovery** (optional) — Tab-kill mid-upload → `/recovery` resumes chunks.

Document the URLs you used in your team notes; redeploy API/worker after changing `BETTER_AUTH_URL` or `ALLOWED_ORIGINS`.

---

## 6. Production promotion

Same layout as staging; use Production env scopes on Vercel and production service variables on Railway. Promote a validated preview with `vercel promote <deployment-url>` only after the smoke checklist passes on that preview.

---

## 7. Troubleshooting

| Symptom               | Likely cause                               | Fix                                                          |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| CORS error on tRPC    | Missing preview URL in `ALLOWED_ORIGINS`   | Add exact origin; redeploy API                               |
| Auth cookie not set   | `BETTER_AUTH_URL` points at Railway API    | Set to Vercel client URL                                     |
| tRPC 404 / wrong host | `NEXT_PUBLIC_API_URL` wrong or stale build | Fix Vercel env; redeploy client                              |
| Worker idle           | `REDIS_URL` or `OPENAI_API_KEY` missing    | Set on worker service; check Railway logs                    |
| Migrate fails         | `DATABASE_URL` not on API service          | Link Postgres plugin; re-run `railway run bun run db:deploy` |
