# Ototabi Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (Next.js :3000)                      │
│                                                                 │
│  Pages: landing, auth, dashboard, studio, export, recovery,     │
│         join, settings, recordings review                       │
│  State: React Query (tRPC), LiveKit room connection             │
│  Local: IndexedDB (Dexie) + OPFS (Origin Private File System)  │
│  Lib: RecorderManager, S3Uploader, ResilientRecordingDB         │
└──────────────┬──────────────────────────────────────────────────┘
               │ Same-origin in dev: /api/trpc, /api/auth, /api/token
               │ (Next rewrites → Express :8080; cookies stay on :3000)
┌──────────────▼──────────────────────────────────────────────────┐
│                     API Server (Express + Bun :8080)             │
│                                                                 │
│  /api/auth/*       → Better Auth handler                        │
│  /api/trpc/*       → tRPC Express middleware                    │
│  /api/token        → LiveKit JWT token generation               │
│                                                                 │
│  Middleware: cors → helmet → /api/auth → json → guest-auth → trpc → /api/token │
└──────────────┬──────────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Prisma │ │LiveKit│ │ MinIO │
│(PG)   │ │ Cloud │ │ (S3)   │
│:5432  │ │ wss   │ │ :9000  │
└───────┘ └───────┘ └───────┘
```

## Package Dependency Graph

```
apps/client ──→ packages/trpc, packages/auth, packages/ui, packages/store, packages/common
apps/api    ──→ packages/trpc, packages/auth, packages/store, packages/common, packages/backend-common
```

- `packages/store` — Prisma schema + client (no dependencies on other workspace packages)
- `packages/auth` — Better Auth config (depends on store)
- `packages/trpc` — tRPC routers (depends on store, auth)
- `packages/ui` — shadcn/ui components + globals.css (no internal deps)
- `packages/common` — shared types, Zod schemas, logger (no internal deps)
- `packages/backend-common` — backend config (depends on common)

## Data Flow: Recording Lifecycle

```
1. Host creates Room          → POST /api/trpc/rooms.createRoom
2. Guest joins via code       → POST /api/trpc/rooms.joinRoom
3. Guest enters studio        → GET /api/token?room=X&username=Y
                              → LiveKit connect with JWT
4. Host starts recording      → POST /api/trpc/rooms.startRecordingSession
                              → RecorderManager.startRecording()
                              → MediaRecorder captures locally
5. Chunks written locally     → IndexedDB (chunks table) + OPFS
6. Chunks uploaded to S3      → S3Uploader multipart upload
                              → POST /api/trpc/uploads.start
                              → POST /api/trpc/uploads.getSignedUrl
                              → PUT to presigned URL
                              → POST /api/trpc/uploads.complete
7. Host stops recording       → POST /api/trpc/rooms.stopRecordingSession
8. Tracks reviewed            → GET /api/trpc/rooms.getRecordingSessionById
9. Export via FFmpeg.wasm     → Client fetches S3 URLs → processes in browser
```

## Auth Flow

Better Auth **runs on the API** (`toNodeHandler` on Express), but **`BETTER_AUTH_URL` / `baseURL` is the URL the browser uses** for `/api/auth/*` — not the internal Express port. See [Better Auth baseURL](https://www.better-auth.com/docs/reference/options#baseurl) and [Cookies / reverse proxy](https://www.better-auth.com/docs/concepts/cookies).

| Dev setting           | Value                              | Meaning                                     |
| --------------------- | ---------------------------------- | ------------------------------------------- |
| Express listen        | `:8080`                            | Process that executes auth handlers         |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080`            | Rewrite target for Next proxy               |
| `BETTER_AUTH_URL`     | `http://localhost:3000`            | Public origin for cookies + OAuth redirects |
| `authClient.baseURL`  | `window.location.origin` (`:3000`) | Must match `BETTER_AUTH_URL`                |

```
1. Sign up/in        → POST http://localhost:3000/api/auth/...  (browser)
                     → Next rewrite → Express :8080 handler
                     → Session cookie scoped to :3000
2. tRPC / token      → Same origin :3000/api/... (cookie included)
                     → createTRPCContext → auth.api.getSession(headers)
3. LiveKit token     → GET /api/token (cookie auth on API)
```

**If you pointed `BETTER_AUTH_URL` at `:8080` while the client used `:3000`**, cookies and redirects would not match the origin the browser actually uses — sessions would look like logouts after navigation.

## Key Principles

- **Local-first**: Recording happens locally, upload is background
- **Server-confirmed**: DB acts as source of truth for session state
- **Thin API**: Express only routes to tRPC and Better Auth
- **Browser processing**: FFmpeg.wasm for all video editing, no server transcoding
- **Recovery-first**: OPFS > IndexedDB for storage, upload resume via ListParts
