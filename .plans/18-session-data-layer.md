# Plan 18: Session data layer — bundled review API

**Status:** done  
**Priority:** P0 (performance + DX)  
**Depends on:** Plan 17 (done), module-first architecture (Plan 11)

## Problem

Recordings and export pages fired **5 parallel tRPC queries** per session (`getRecordingSessionById`, `recordingEvents`, `syncMarkers`, `transcript` segments + chapters, duplicate `auth`). That meant:

- Extra HTTP round-trips and React Query overhead
- Duplicate auth checks and permission logic
- Harder loading/error UX (five independent spinners)

## Solution

### Server (`sessionReview` module)

| File                           | Role                                            |
| ------------------------------ | ----------------------------------------------- |
| `session-review.repository.ts` | One scoped session fetch + `Promise.all` bundle |
| `session-review.policy.ts`     | Access predicate                                |
| `session-review.mapper.ts`     | API-safe response                               |
| `session-review.service.ts`    | Orchestration                                   |
| `session-review.router.ts`     | `sessionReview.get` (hostProcedure)             |

### Client

| File                        | Role                                                |
| --------------------------- | --------------------------------------------------- |
| `use-session-review.ts`     | TanStack Query + `useMemo` / `session-review-utils` |
| `export-console-store.ts`   | Zustand — export UI (selection, trim, FFmpeg)       |
| `recording-store.ts`        | Zustand — studio REC / pause                        |
| `date-utils.ts`             | date-fns — all formatted dates/timers               |
| `analog-state-panel.tsx`    | Shared loading / empty / error chassis              |
| `require-auth.tsx`          | Auth gate for host layouts                          |
| Recordings + export layouts | `RequireAuth` → `RequireHost`                       |

**State split:** React Query = server/cache; Zustand = client UI shared across siblings; no custom Context mirrors.

### Pages refactored

- `/recordings/[sessionId]` — single `useSessionReview`
- `/export/[sessionId]` — single `useSessionReview` + `SessionStatusRail`

## Next (optional)

- `cacheComponents: true` when marketing routes split static RSC shell
- Invalidate `sessionReview` tag on upload complete / transcript ready
- Extend bundle with upload_session status (Plan 13)

## Acceptance

- [x] One tRPC query loads full session review payload
- [x] No duplicate `auth.getSession` on review pages (layout gates)
- [x] `bun fmt`, `bun lint`, `bun typecheck`, `bun run test` pass
