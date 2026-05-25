# Ototabi Studio

**Browser-based podcast recording platform — a Riverside.fm alternative you can self-host.**

Records high-quality audio/video locally per participant via LiveKit, uploads tracks to S3/MinIO via multipart upload, and provides browser-based post-production with FFmpeg.wasm. Free noise reduction, text-based editing, AI transcript pipeline. Retro analog dark mode UI.

## Quick Start

```bash
git clone <repo> ototabi
cd ototabi
cp .env.example .env        # edit with your LiveKit keys
docker compose up -d        # PostgreSQL + MinIO + Redis
bun install
bun run db:migrate
bun dev                     # Next.js :3000 + API :8080 + Worker
```

See [`.docs/quick-start.md`](.docs/quick-start.md) for details.

## Architecture

```
apps/
├── client/         Next.js 16 (Turbopack) — pages, UI, recorder, S3 uploader
├── api/            Express + Bun — tRPC, Better Auth, LiveKit tokens, webhooks
└── worker/         BullMQ processor — Whisper transcript, LLM chapters

packages/
├── trpc/           API boundary — module-first: router → service → repository → policy
├── store/          Prisma ORM — 12 models, migrations, PostgreSQL
├── auth/           Better Auth — email/password + guest sessions
├── ui/             shadcn/ui — retro analog design tokens, globals.css
├── jobs/           BullMQ queue definitions + job types
├── billing/        Polar.sh — subscription checkout, webhook, plan gating
├── common/         Zod schemas, ConfigLoader, Winston logger
└── backend-common/ Backend config loader
```

## Features

| Feature                | Details                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| **Local recording**    | 720p / 1080p / 4K per participant, MediaRecorder + IndexedDB + OPFS  |
| **Separate tracks**    | Each participant's camera + mic + screen share = discrete files      |
| **Guest join**         | One-click join — no account needed, pre-flight device check          |
| **Pause / resume**     | Pause during recording, resume seamlessly                            |
| **Upload resilience**  | Multipart S3/MinIO with auto-resume, dual IndexedDB + OPFS storage   |
| **Keyboard shortcuts** | `R` record, `M` mute, `Space` push-to-talk, `?` overlay              |
| **Noise reduction**    | Free FFmpeg.wasm `afftdn` filter — Riverside charges $24/mo for this |
| **Text-based editing** | Click transcript text → cuts video at those timestamps               |
| **AI transcript**      | Whisper API → word-level timestamps, auto chapters, show notes       |
| **Clip export**        | Merge, trim, re-encode (720p/1080p) with FFmpeg.wasm                 |
| **Room sharing**       | Invite collaborators by email — host / editor / viewer roles         |
| **Billing**            | Polar.sh — trial → Creator ($15) → Pro ($29) → Studio ($59)          |

## Quality Gates

```bash
bun fmt:check     # oxfmt (0 deps, native speed)
bun lint          # oxlint (0 errors enforced)
bun typecheck     # TypeScript across all packages
bun run test      # Bun test (turbo)
bun run build     # Next.js + API + worker
```

Zero eslint, zero prettier. Built on [oxc](https://oxc.rs).

## Environment Variables

See [`.env.example`](.env.example). Key vars:

| Var                          | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection                        |
| `LIVEKIT_URL / KEY / SECRET` | LiveKit Cloud (or self-hosted)               |
| `AWS_*` or `MINIO_*`         | S3-compatible storage                        |
| `REDIS_URL`                  | BullMQ worker queue                          |
| `OPENAI_API_KEY`             | Optional — enables transcript + LLM features |
| `POLAR_ACCESS_TOKEN`         | Optional — enables subscription billing      |
| `BETTER_AUTH_SECRET`         | Session encryption                           |

## Docker Compose

```
docker compose up -d
├── postgres:16-alpine     → :5432
├── minio/minio            → :9000 (API), :9001 (console)
├── redis:7-alpine         → :6379
└── createbuckets (init)   → auto-creates ototabi-recordings bucket
```

## Architecture Docs

- [`.docs/architecture.md`](.docs/architecture.md) — system overview, data flow, auth flow
- [`.docs/encyclopedia.md`](.docs/encyclopedia.md) — glossary of all concepts
- [`.docs/workspace-layout.md`](.docs/workspace-layout.md) — package map, import rules
- [`.plans/`](.plans/) — 12 scoped engineering plans
- [`AGENTS.md`](AGENTS.md) — AI coding conventions

## Self-Hostable, No Vendor Lock-in

- **Bring your own S3**: MinIO (local), R2, AWS S3 — any S3-compatible endpoint
- **Bring your own LiveKit**: Cloud or self-hosted
- **Bring your own AI keys**: OpenAI Whisper + GPT-4o-mini (all AI features optional)
- **Zero telemetry**: Your data stays in your infrastructure
- **MIT licensed**: fork it, modify it, run your own instance

## Tech Stack

Next.js 16 · Express 5 · Bun · tRPC 11 · Prisma 6 · PostgreSQL 16 · Better Auth · LiveKit · BullMQ · Redis · MinIO · FFmpeg.wasm · Tailwind CSS 4 · shadcn/ui · oxlint/oxfmt · Turbo
