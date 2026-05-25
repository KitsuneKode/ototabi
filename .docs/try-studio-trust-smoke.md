# Studio trust — local smoke

Riverside parity **Wave B / Wave 1 Stream 2** (Plan 13 Phase 2). Many steps are **placeholders** until preflight, consent, and health ship.

## Prerequisites

| Check        | Detail                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Infra        | Postgres, Redis, MinIO — see [try-local-smoke.md](./try-local-smoke.md) |
| Two browsers | Host + guest accounts (or incognito guest)                              |
| Room         | Host creates room, optional **Studio Gate** lock                        |

## 1. Preflight (placeholder)

**Target:** `/studio/preflight` or gate before `enterStudio` — mic, camera, storage, network.

**Today:** enter studio directly from room/chat link.

- [ ] Document baseline: studio loads without dedicated preflight route
- [ ] After implementation: failing mic blocks enter with clear copy

## 2. Recording consent (placeholder)

**Target:** all participants acknowledge local capture before record.

**Today:** verify record start without consent modal (gap).

- [ ] Host starts record → guest sees recording indicator only
- [ ] After implementation: guest must accept before capture arms

## 3. Co-host / guest policy (partial — shippable now)

1. Host enables **Lock** on room settings.
2. Guest with invite joins → queued until **Admit**.
3. Host **mute request** / **remove guest** — exercise join-request flows if exposed in UI.
4. Policy tests: `packages/trpc/src/modules/rooms/rooms.policy.test.ts` (`bun run test --filter=@ototabi/trpc`).

## 4. Session health panel (placeholder)

**Target:** host sees per-participant connection, OPFS, upload queue, devices.

**Today:** use studio upload LEDs / part progress as informal health.

- [ ] No dedicated health drawer — note in handoff
- [ ] After `readiness.ts` + panel: host opens health → sees participant rows

## Sign-off

- [ ] Lock + admit path works (existing)
- [ ] Preflight / consent / health marked pass or explicitly deferred in [subagent-handoff.md](./subagent-handoff.md)
