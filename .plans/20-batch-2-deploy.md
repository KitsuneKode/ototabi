# Batch 2 — Vercel + Railway Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans`. Use `deployment-expert` / Vercel plugin skills for platform specifics.

**Goal:** Production split deploy — Vercel `@ototabi/client`, Railway `api` + `worker` + Postgres + Redis.

**Architecture:** `NEXT_PUBLIC_API_URL` → Railway public URL; cross-origin Better Auth; Turbo filtered build on Vercel.

**Tech stack:** Vercel, Railway, Docker `oven/bun`, Turborepo.

---

## Files to create/modify

| File                       | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `apps/client/vercel.json`  | install/build commands                   |
| `apps/api/Dockerfile`      | Bun API image, repo root context         |
| `apps/worker/Dockerfile`   | Bun worker image                         |
| `railway.toml`             | optional multi-service                   |
| `.docs/deploy-railway.md`  | operator runbook                         |
| `.docs/ci.md`              | update pipeline                          |
| `.env.example`             | production URL examples                  |
| `turbo.json`               | expand `globalEnv`                       |
| `packages/auth/*`          | `trustedOrigins` / CORS for split origin |
| `.github/workflows/ci.yml` | add `bun run test`                       |

---

## Task checklist

- [ ] **Task 1:** `apps/api/Dockerfile` — root context, `bun install`, `db:generate`, `CMD bun ./src/server.ts`, `EXPOSE` / `PORT`
- [ ] **Task 2:** `apps/worker/Dockerfile` — same pattern, no public port
- [ ] **Task 3:** `apps/client/vercel.json` — `turbo run build --filter=@ototabi/client`
- [ ] **Task 4:** `.docs/deploy-railway.md` — plugins, env matrix, migration command, smoke
- [ ] **Task 5:** Auth cross-origin checklist — `BETTER_AUTH_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`
- [ ] **Task 6:** CI adds `bun run test`
- [ ] **Task 7:** Manual deploy to Railway staging + Vercel preview — verify login + `sessionReview.get`

**Note:** User asked not to push; local deploy config + docs still land in repo.

---

## Verification

- [ ] `bun fmt && bun lint && bun typecheck && bun run test`
- [ ] Vercel preview build succeeds (if credentials available)
- [ ] Railway API health responds (if project linked)

Evidence required before claiming Batch 2 complete.
