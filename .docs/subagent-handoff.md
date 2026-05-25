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
