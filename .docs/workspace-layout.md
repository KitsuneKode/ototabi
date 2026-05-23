# Workspace Layout

```
ototabi/
├── apps/
│   ├── api/                    # Express API server (Bun)
│   │   └── src/
│   │       ├── server.ts       # Entry: config validation, graceful shutdown
│   │       ├── app.ts          # Express setup: middleware stack
│   │       ├── routes/         # REST endpoints (LiveKit token only)
│   │       ├── middlewares/    # Timing, error handling, async handler
│   │       └── utils/          # Config, Winston logger
│   │
│   └── client/                 # Next.js 16 frontend (Turbopack)
│       ├── app/                # App Router pages
│       │   ├── auth/           # signin, signup
│       │   ├── chat/[roomId]/  # Studio page (LiveKit room + recorder)
│       │   ├── dashboard/      # Room management
│       │   ├── export/         # FFmpeg.wasm video editor
│       │   ├── mockups/        # Design mockup pages
│       │   ├── recordings/     # Session review
│       │   ├── recovery/       # Upload recovery console
│       │   ├── rooms/          # Room join, settings
│       │   └── settings/       # User settings
│       ├── components/
│       │   ├── ui/             # Retro analog primitives
│       │   ├── providers.tsx   # TRPCReactProvider, ThemeProvider
│       │   └── error-boundary.tsx
│       ├── lib/
│       │   ├── localDB/        # Dexie (IndexedDB) — chunks + uploadSessions
│       │   ├── recorder/       # RecorderManager
│       │   ├── uploader/       # S3Uploader
│       │   └── hooks/          # useTimer
│       └── trpc/               # tRPC client setup (React + vanilla)
│
├── packages/
│   ├── auth/                   # Better Auth (server config + React client)
│   ├── trpc/                   # tRPC routers + Express adapter
│   ├── store/                  # Prisma schema + client + migrations
│   ├── ui/                     # shadcn/ui + globals.css (design tokens)
│   ├── common/                 # Zod schemas, ConfigLoader, Winston
│   └── backend-common/         # Backend config loader
│
├── tooling/
│   ├── typescript-config/      # base, nextjs, react-library, backend
│   └── eslint-config/          # (deprecated — replaced by oxlint)
│
├── .docs/                      # Architecture documentation
├── .plans/                     # Feature plans
├── docker-compose.yml          # PostgreSQL + MinIO
├── turbo.json                  # Turborepo pipeline config
└── package.json                # Root workspace + scripts
```

## Import Rules

| From Package      | Can Import                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `apps/client`     | `@ototabi/trpc`, `@ototabi/auth/client`, `@ototabi/ui`, `@ototabi/store` (types), `@ototabi/common` |
| `apps/api`        | `@ototabi/trpc`, `@ototabi/auth`, `@ototabi/store`, `@ototabi/common`, `@ototabi/backend-common`    |
| `packages/trpc`   | `@ototabi/auth`, `@ototabi/store`                                                                   |
| `packages/auth`   | `@ototabi/store`                                                                                    |
| `packages/store`  | Nothing internal                                                                                    |
| `packages/ui`     | Nothing internal                                                                                    |
| `packages/common` | Nothing internal                                                                                    |

**Never import from `apps/` into `packages/`.** Packages are libraries, apps are consumers.
