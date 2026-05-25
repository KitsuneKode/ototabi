# Playwright smoke (Phase 2 — optional)

Manual E2E scaffold for parity v1. **Not wired into** root `bun run test` / CI yet.

## Prerequisites

1. Client running (local `bun run dev` in `apps/client` or Vercel preview).
2. API + DB available if pages call tRPC (preview may show shell-only without auth).

## Install & run

```bash
cd e2e
bun install
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app bun run test
```

Local default: `http://localhost:3000` if `PLAYWRIGHT_BASE_URL` is unset.

## Specs

| File                   | Checks                                                 |
| ---------------------- | ------------------------------------------------------ |
| `specs/auth.spec.ts`   | `/auth` loads sign-in surface                          |
| `specs/studio.spec.ts` | `/dashboard` or studio route returns 200               |
| `specs/export.spec.ts` | `/export` route pattern loads (placeholder session id) |

Extend with authenticated storage state before enabling in CI.
