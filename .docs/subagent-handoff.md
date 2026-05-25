# Subagent handoff template

Copy a section per parallel stream (Wave 1+). Coordinator (Wave 0) owns this file structure.

## Stream metadata

| Field             | Value                                          |
| ----------------- | ---------------------------------------------- |
| **Wave / stream** | e.g. Wave 1 — Billing & usage caps             |
| **Owner**         | agent or human                                 |
| **Branch**        | e.g. `integration/parity-v1` or feature branch |
| **Plan refs**     | `.plans/08`, `.plans/28`, etc.                 |

## Scope

One paragraph: what shipped vs explicitly out of scope.

## Files touched

Bullet list of paths (routers, services, policies, client pages, migrations).

## Tests added / updated

| Package            | Command                | Notes                                                                                                       |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `@ototabi/billing` | `bun run test` (turbo) | `packages/billing/src/plan-policy.test.ts` — **runs under root `bun run test`** via `@ototabi/billing:test` |
| `@ototabi/trpc`    | same                   | `*.policy.test.ts`, `*.gates.test.ts`                                                                       |
| `@ototabi/client`  | same                   | unit tests in `apps/client`                                                                                 |

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test` (never bare `bun test` at repo root).

## Smoke steps

Link lane doc and checklist:

- Billing: [try-billing-smoke.md](./try-billing-smoke.md)
- Studio trust: [try-studio-trust-smoke.md](./try-studio-trust-smoke.md)
- Full path: [try-local-smoke.md](./try-local-smoke.md)

## Blockers

What Wave N+1 needs from this stream (schema, env, product decision).

---

## Wave 0 — Coordinator (completed baseline)

| Item                               | Status                                                           |
| ---------------------------------- | ---------------------------------------------------------------- |
| Plan gates + Plan 28 committed     | `feat(billing): wire plan gates and add parity consensus docs`   |
| Scaffold smoke docs                | this file + `try-billing-smoke.md` + `try-studio-trust-smoke.md` |
| `@ototabi/billing` in turbo `test` | Confirmed — 5 tests in `plan-policy.test.ts`                     |

### Blockers for Wave 1

| Stream              | Blocker                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Billing / usage** | Trial session cap (3) and Creator 10 clips/month need usage counter + schema; client export must read `billing.getSubscription` for Trial UI |
| **Studio trust**    | **Stream 2 shipped** — see section below. Wave 2 health panel still blocked on merging PR2 first.                                            |
| **Shared**          | `DODO_PAYMENTS_API_KEY` unset → `shouldBypassPlanGates()` skips server plan checks (dev only)                                                |

---

## Wave 1 Stream 2 — Studio trust (PR2)

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| **Wave / stream** | Wave 1 — Studio trust (preflight, consent, co-host, controls) |
| **Branch**        | `feat/parity-stream2-studio-trust` (local)                    |
| **Plan refs**     | `.plans/13`, `.plans/28` §7                                   |

### Scope

Shipped: `readiness.ts` + tests, `/chat/[roomId]/preflight`, recording consent on `RoomParticipant.recordingConsentedAt`, `canControlStudio` policy, co-host lock/admit/remove/mute-request APIs, studio UI (consent modal, REC for all, roster host controls). Out of scope: session health panel (Wave 2), usage/billing, export page.

### Files touched

- `apps/client/lib/studio/readiness.ts`, `readiness.test.ts`
- `apps/client/app/(site)/chat/[roomId]/preflight/page.tsx`
- `apps/client/components/studio/studio-recording-consent.tsx`
- `apps/client/components/studio/studio-participant-roster.tsx`
- `apps/client/app/(site)/chat/[roomId]/page.tsx`
- `apps/client/app/(site)/rooms/[roomId]/join/page.tsx` (redirect via preflight)
- `apps/client/lib/recorder/recorder-manager.ts`, `lib/hooks/use-studio-connection.ts`
- `packages/store/prisma/schema.prisma` + migration `20260526180000_room_participant_recording_consent`
- `packages/trpc/src/modules/rooms/rooms.policy.ts`, `.test.ts`, `rooms.service.ts`, `rooms.router.ts`, `rooms.repository.ts`
- `.docs/try-studio-trust-smoke.md`, `.docs/subagent-handoff.md`

### Tests added / updated

| Package           | Notes                                                |
| ----------------- | ---------------------------------------------------- |
| `@ototabi/client` | `readiness.test.ts` — 9 tests                        |
| `@ototabi/trpc`   | `rooms.policy.test.ts` — +3 co-host / editor cases   |
| `@ototabi/trpc`   | `enter-studio.test.ts` — unchanged (regression only) |

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test`

### Smoke steps

[try-studio-trust-smoke.md](./try-studio-trust-smoke.md) — preflight warn/block, consent before capture, co-host admit/record, mute/remove/REC.

### Blockers for Wave 2 (health panel)

| Blocker      | Detail                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Merge order  | PR2 must merge before editing `chat/[roomId]/page.tsx` for health sidebar                                                         |
| Data sources | Health panel needs upload queue (existing progress map), consent from `getStudioContext`, connection from LiveKit — no new schema |
| Optional API | `rooms.getStudioHealth` or extend studio poll — not added in Stream 2                                                             |
| Mapper tests | Plan suggests `studio-health.mapper.test.ts` when aggregating events — Wave 2 deliverable                                         |

---

## Wave 2 Stream 3 — Session health panel (PR3)

| Field             | Value                                                |
| ----------------- | ---------------------------------------------------- |
| **Wave / stream** | Wave 2 — Session health panel (after studio trust)   |
| **Branch**        | `feat/parity-stream3-health` (local)                 |
| **Plan refs**     | `.plans/28` §7, parity subagent plan Wave 2 Stream 3 |

### Scope

Shipped: studio sidebar **Health** tab with per-participant link/upload/consent/recovery rows; `rooms.getStudioHealth` for server consent snapshot; pure `studio-health.mapper` + tests; client merge of LiveKit roster, upload progress map, local OPFS pending count, and device labels from join params.

Out of scope: export page, usage module, demo editor, timeline MVP.

### Files touched

- `apps/client/app/(site)/chat/[roomId]/page.tsx` — Health tab + `StudioHealthPanel`
- `apps/client/components/studio/studio-health-panel.tsx` (new)
- `packages/trpc/src/modules/rooms/studio-health.mapper.ts`, `.test.ts`
- `packages/trpc/src/modules/rooms/rooms.service.ts`, `rooms.router.ts`, `rooms.repository.ts`
- `packages/trpc/package.json` — export `@ototabi/trpc/studio-health`
- `.docs/subagent-handoff.md`, `.docs/try-studio-trust-smoke.md`

### Tests added / updated

| Package         | Tests                                                                |
| --------------- | -------------------------------------------------------------------- |
| `@ototabi/trpc` | `studio-health.mapper.test.ts` — consent, upload, recovery, identity |

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test`

### Smoke steps

[try-studio-trust-smoke.md](./try-studio-trust-smoke.md) — section 6 (session health panel).

### Blockers for Wave 2 Stream 4

- None from health panel. Export polish can proceed in parallel on `export/[sessionId]/page.tsx`.

---

## Wave 1 Stream 1 — Billing & usage caps

| Field             | Value                                                          |
| ----------------- | -------------------------------------------------------------- |
| **Wave / stream** | Wave 1 — Billing & usage caps                                  |
| **Branch**        | `feat/parity-stream1-usage` (or merged to integration branch)  |
| **Plan refs**     | `.plans/08`, `.plans/28`, parity subagent plan Wave 1 Stream 1 |

### Scope

Shipped usage counters, trial transcript teaser (1 lifetime Whisper per host), trial session cap (3 completed studio sessions), Creator clip monthly cap (10 ops), export page Pro+ cut UI gate, and `usage.get` snapshot for client.

Out of scope: studio preflight/consent (Stream 2), settings trial banner, worker export routing.

### Files touched

- `packages/store/prisma/schema.prisma` + `migrations/20260526180000_usage_counter/`
- `packages/trpc/src/modules/usage/` (dto, policy, repository, service, router, policy tests)
- `packages/trpc/src/lib/schedule-transcript.ts`, `schedule-transcript.gates.ts`, `*.gates.test.ts`
- `packages/trpc/src/modules/rooms/rooms.service.ts` (session cap, transcript via scheduler)
- `packages/trpc/src/modules/clips/clips.service.ts` (clip cap)
- `packages/trpc/src/routers/_app.ts`
- `apps/client/app/(site)/export/[sessionId]/page.tsx`
- `.docs/try-billing-smoke.md`, `.docs/subagent-handoff.md`

### Tests added / updated

| Package         | Tests                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| `@ototabi/trpc` | `usage.policy.test.ts` (new), `schedule-transcript.gates.test.ts` (teaser cases) |

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test`

### Smoke steps

[try-billing-smoke.md](./try-billing-smoke.md) — sections 1–4 with real steps (no longer N/A).

### Blockers for Stream 2

- None from usage module. Stream 2 may proceed in parallel; avoid editing `rooms.policy.ts` co-host extensions per ownership split.
- Stream 3 health panel still merges after Stream 2 on `chat/[roomId]/page.tsx`.
