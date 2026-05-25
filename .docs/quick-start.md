# Quick Start

## Prerequisites

- **Bun** >= 1.2.0
- **Docker** (for PostgreSQL + MinIO)
- **Node.js** >= 18

## Setup

```bash
# 1. Clone
git clone <repo-url> ototabi
cd ototabi

# 2. Copy env
cp .env.example .env
# Edit .env with your LiveKit credentials

# 3. Start infrastructure
docker compose up -d

# 4. Install dependencies
bun install

# 5. Run database migrations
bun run db:migrate

# 6. Start development
bun dev
```

## Services

| Service       | URL                   | Purpose               |
| ------------- | --------------------- | --------------------- |
| Next.js       | http://localhost:3000 | Frontend app          |
| Express API   | http://localhost:8080 | Backend API + tRPC    |
| PostgreSQL    | localhost:5432        | Database              |
| MinIO API     | localhost:9000        | S3-compatible storage |
| MinIO Console | localhost:9001        | Storage admin UI      |
| Redis         | localhost:6379        | BullMQ worker queue   |

## Backend configuration checklist

`bun dev` runs **client (:3000)**, **api (:8080)**, and **worker** together. All three read the **repo root** `.env` (copy from `.env.example`).

### Required for core studio flow

| Variable                  | Where used                     | Dev value / notes                                                                                |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`            | API, client SSR, Prisma        | `postgresql://user:password@localhost:5432/ototabi?schema=public` (matches `docker-compose.yml`) |
| `BETTER_AUTH_SECRET`      | API + client (session signing) | Long random string; **same value** in one `.env`                                                 |
| `BETTER_AUTH_URL`         | `@ototabi/auth` `baseURL`      | **`http://localhost:3000`** — browser origin, not `:8080`                                        |
| `FRONTEND_URL`            | API CORS                       | `http://localhost:3000`                                                                          |
| `NEXT_PUBLIC_APP_URL`     | Auth client SSR fallback       | `http://localhost:3000`                                                                          |
| `NEXT_PUBLIC_API_URL`     | Next rewrites target           | `http://localhost:8080`                                                                          |
| `LIVEKIT_URL`             | API token route                | `wss://…` from LiveKit Cloud dashboard                                                           |
| `LIVEKIT_API_KEY`         | API token route                | LiveKit project API key                                                                          |
| `LIVEKIT_API_SECRET`      | API token route                | LiveKit project secret                                                                           |
| `NEXT_PUBLIC_LIVEKIT_URL` | Client `room.connect()`        | **Must match** `LIVEKIT_URL` exactly                                                             |

### Required for uploads (Plan 13 trust path)

| Variable                                      | Where used                                                        |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `packages/trpc` uploads (presigned URLs)                          |
| `AWS_S3_BUCKET_NAME`                          | Multipart upload target (`ototabi-recordings` after compose init) |
| `AWS_S3_ENDPOINT`                             | `http://localhost:9000` for local MinIO                           |
| `AWS_S3_REGION`                               | e.g. `us-east-1`                                                  |

Without S3 vars, uploads fall back to **mock URLs** — recording works locally but tracks will not persist to MinIO.

### Optional (plans 04, 06, 08)

| Variable          | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `REDIS_URL`       | Worker + transcript/LLM queues (`redis://localhost:6379`)     |
| `OPENAI_API_KEY`  | Whisper transcript + LLM jobs                                 |
| `DODO_PAYMENTS_*` | Billing — checkout + `/api/dodo-webhook` (see `.env.example`) |

### Transcript pipeline (Plan 04)

1. Set `OPENAI_API_KEY` and `REDIS_URL` in repo root `.env`.
2. Run `bun dev` (starts API, client, and **worker**).
3. Host stops a session after the microphone track upload completes.
4. Worker queue `transcript` runs Whisper; segments appear on `/recordings/[sessionId]`.

### Express routes (API `:8080`)

| Path              | Handler                                                     |
| ----------------- | ----------------------------------------------------------- |
| `/api/auth/*`     | Better Auth (`toNodeHandler`) — **before** `express.json()` |
| `/api/guest-auth` | Guest session (`createGuestSession` → signed cookies)       |
| `/api/trpc/*`     | tRPC (`createTRPCContext` → `auth.api.getSession`)          |
| `/api/token`      | LiveKit JWT (session cookie + room/invite check)            |

Next.js **rewrites** (client `:3000`) proxy `/api/auth`, `/api/trpc`, `/api/guest-auth`, `/api/token` → `:8080` so cookies stay on `:3000`.

### Full local Creator Suite smoke

See [try-local-smoke.md](./try-local-smoke.md) for auth → studio → AI clips → reels presets → demo → export.

### Recording trust smoke (Plan 13)

See [try-recovery-smoke.md](./try-recovery-smoke.md) for the full tab-kill → recovery → retry script.

1. Host signs in → create room → open studio (`/chat/{code}`).
2. Start/stop recording; confirm final chunk uploads (mic track `COMPLETED` in session review).
3. Kill browser tab mid-upload → open **Recovery** → retry pending chunks.
4. Guest join requires `?invite=` token (Room Settings → create invite).
5. Export page applies sync marker offset when markers exist; warns when multi-track export has no markers.

### Smoke test (backend)

```bash
# After bun dev + .env filled:
curl -s http://localhost:8080/api/trpc/auth.getSession -H 'content-type: application/json' -d '{}'
# Expect JSON (null session if not logged in)

# LiveKit (requires session cookie from browser sign-in — use DevTools → Application → Cookies)
# GET http://localhost:3000/api/token?room=ROOMCODE&username=Test
```

### Guest join (Plan 01 + 13)

1. Host creates **invite link** in Room Settings (`?invite=…` in URL).
2. Guest opens invite → name → `/api/guest-auth` → `rooms.joinRoom` → studio.
3. Plain `/rooms/{code}/join` without `?invite=` is **blocked** for guests by design.

## Common Tasks

```bash
# Format code
bun fmt

# Check formatting (CI)
bun fmt:check

# Lint
bun lint

# Type check
bun typecheck

# Build all packages
bun run build

# Run tests
bun run test

# Database studio (GUI)
bun run db:studio

# Generate Prisma client after schema changes
bun run db:generate
```
