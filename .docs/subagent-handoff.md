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
| **Studio trust**    | Preflight route + consent UI not built; health panel placeholder only — depends on `apps/client/lib/studio/readiness.ts` (Wave 1 Stream 2)   |
| **Shared**          | `DODO_PAYMENTS_API_KEY` unset → `shouldBypassPlanGates()` skips server plan checks (dev only)                                                |

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

## Wave 2 Stream 4 — Export polish (PR4)

| Field             | Value                                             |
| ----------------- | ------------------------------------------------- |
| **Wave / stream** | Wave 2 — Export preview + sync alignment warnings |
| **Branch**        | `feat/parity-stream4-export`                      |
| **Plan refs**     | Plan 05 preview, Plan 03 sync warnings slice      |

### Scope

Shipped: cut preview before apply (`cut-preview.ts`, `summarizeCutPreview`, transcript highlight + keep/remove stats); `getSyncAlignmentWarnings` on timeline + merge/export; `computeKeepRanges` shared with `handleCuts`.

Out of scope: chat studio, rooms.policy co-host, timeline MVP.

### Files touched

- `apps/client/app/(site)/export/[sessionId]/page.tsx`
- `apps/client/components/editor/transcript-editor.tsx`
- `apps/client/lib/cut-preview.ts`, `cut-preview.test.ts`
- `apps/client/lib/merge-session-timeline.ts`, `merge-session-timeline.test.ts`

### Tests added

- `apps/client/lib/cut-preview.test.ts`
- `apps/client/lib/merge-session-timeline.test.ts`

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test` — pass.

### Smoke steps

[try-local-smoke.md](./try-local-smoke.md) §7 — mark segments → preview stats/highlight → apply cuts; multi-track export shows sync warnings when markers missing/sparse.
