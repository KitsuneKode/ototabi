# Plans

Each file is a scoped engineering initiative, implementable in one PR.

| #   | File                                       | Status                                                                         | Priority |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------ | -------- |
| 01  | `01-guest-join-no-auth.md`                 | done                                                                           | P0       |
| 02  | `02-local-recording-opfs-recovery.md`      | done                                                                           | P0       |
| 03  | `03-sync-markers-livekit-rtp.md`           | in-progress                                                                    | P1       |
| 04  | `04-transcript-pipeline-whisper.md`        | done                                                                           | P1       |
| 05  | `05-text-based-editing.md`                 | in-progress (FFmpeg cuts shipped; preview + UI gate TBD)                       | P1       |
| 06  | `06-ai-features-chapters-clips-notes.md`   | in-progress (pipeline + clips; polish/regen TBD)                               | P2       |
| 07  | `07-multi-track-timeline-editor.md`        | pending                                                                        | P2       |
| 08  | `08-billing-stripe-subscriptions.md`       | done in code (usage caps + export Pro UI gate; staging smoke pending)          | P2       |
| 09  | `09-distribution-youtube-bundles.md`       | done (v1 selective export + ZIP; YouTube/embed deferred)                       | P2       |
| 10  | `10-oxc-migration.md`                      | in-progress                                                                    | P0       |
| 11  | `11-module-first-architecture-refactor.md` | pending                                                                        | P1       |
| 12  | `12-ux-polish-keyboard-animation.md`       | in-progress                                                                    | P1       |
| 13  | `13-riverside-competitive-roadmap.md`      | done in code (preflight, consent, health, mute/remove, co-host; smoke pending) | P0       |
| 14  | `14-retro-analog-v2-product-shell.md`      | done                                                                           | P1       |
| 15  | `15-premium-ux-master-plan.md`             | in-progress                                                                    | P1       |
| 16  | `16-retro-analog-v3-product-grade.md`      | done (batch 4; Phase 5 studio deferred)                                        | P0       |
| 17  | `17-handoff-remainder.md`                  | done                                                                           | P0       |
| 18  | `18-session-data-layer.md`                 | done                                                                           | P0       |
| 19  | `19-creator-suite-vision.md`               | done (strategy locked)                                                         | P0       |
| 20  | `20-creator-suite-execution.md` + batches  | done (batches 0–6)                                                             | P0       |
| 24  | `24-demo-mode-browser.md`                  | done                                                                           | P2       |
| 25  | `25-parallel-subagent-execution.md`        | done (waves A–F code); smoke operator                                          | P0       |
| 26  | `20-batch-6-reels.md`                      | done (May 2026)                                                                | P2       |
| 27  | `27-upload-concurrency.md`                 | done (May 2026)                                                                | P0       |
| 28  | `28-engineering-consensus-may-2026.md`     | parity-v1 consensus record; superseded by Plan 31 for execution order          | P0       |
| 30  | `30-v1.1-execution-brief.md`               | draft v1.1 scope proposal; not current execution source until reconciled       | P1       |
| 31  | `31-production-hardening-master-plan.md`   | current production-hardening master plan                                       | P0       |

## Current focus (May 2026)

**Shipped on `main`:** Creator Suite batches 0–6, parallel waves A–F, demo v1.1, trust/upload policy, CI, brand/OG, **Plan 27** upload pool, **Plan 13 Phase 2** lock/admit + unified `enterStudio`, preflight, consent, health, mute/remove, co-host policy, **Plan 09** export bundles, **Plan 08** Dodo Payments, usage caps, export Pro UI gate, AI pipeline status/dedup, DB list indexes, and **Plan 24** browser demo mode.

**Operator next (no new code required):**

1. `git push` + `bun run db:migrate`
2. [try-local-smoke.md](../.docs/try-local-smoke.md) — full record → upload → AI → export → studio lock
3. Dodo dashboard: products + `DODO_PRODUCT_*` + webhook URL → `/api/dodo-webhook`

**Execution order:** Current production hardening order is [31-production-hardening-master-plan.md](31-production-hardening-master-plan.md). Plan 28 remains the parity-v1 consensus record; Plan 30 remains a draft v1.1 scope proposal and is not the current execution source until reconciled.

1. **PR 0 docs/gate baseline** — reconcile plan truth, smoke logs, and formatting.
2. **P0 sync/export reliability** — per-track alignment before broader post-production expansion.
3. **Architecture cleanup** — split overloaded rooms/export surfaces along module boundaries.
4. **Production UX/accessibility polish** — focus, native controls, tab semantics, export-state clarity.
5. **Deferred v1.1 features** — may be planned, but not built before sync/export reliability and architecture cleanup.

## Convention

- Status: `pending` → `in-progress` → `done`
- Priority: `P0` (blocking) → `P1` (core) → `P2` (enhancement)
- Each plan is a concise spec: problem, solution, files to change, acceptance criteria

## Design source of truth

- `PRODUCT.md` — users, jobs, anti-references
- `DESIGN.md` — Retro Analog v2/v3 tokens, registers, motion
- `.docs/encyclopedia.md` — domain + design glossary
- `/mockups` — exploratory only; production UI follows Retro Analog
