# Plans

Each file is a scoped engineering initiative, implementable in one PR.

| #   | File                                       | Status                                                      | Priority |
| --- | ------------------------------------------ | ----------------------------------------------------------- | -------- |
| 01  | `01-guest-join-no-auth.md`                 | done                                                        | P0       |
| 02  | `02-local-recording-opfs-recovery.md`      | done                                                        | P0       |
| 03  | `03-sync-markers-livekit-rtp.md`           | in-progress                                                 | P1       |
| 04  | `04-transcript-pipeline-whisper.md`        | done                                                        | P1       |
| 05  | `05-text-based-editing.md`                 | in-progress (FFmpeg cuts shipped; preview + UI gate TBD)    | P1       |
| 06  | `06-ai-features-chapters-clips-notes.md`   | in-progress (pipeline + clips; polish/regen TBD)            | P2       |
| 07  | `07-multi-track-timeline-editor.md`        | pending                                                     | P2       |
| 08  | `08-billing-stripe-subscriptions.md`       | in-progress (Dodo done; API gates wired; usage caps TBD)    | P2       |
| 09  | `09-distribution-youtube-bundles.md`       | done (v1 selective export + ZIP; YouTube/embed deferred)    | P2       |
| 10  | `10-oxc-migration.md`                      | in-progress                                                 | P0       |
| 11  | `11-module-first-architecture-refactor.md` | pending                                                     | P1       |
| 12  | `12-ux-polish-keyboard-animation.md`       | in-progress                                                 | P1       |
| 13  | `13-riverside-competitive-roadmap.md`      | in-progress (Phase 0–1 partial; Phase 2 lock/admit shipped) | P0       |
| 14  | `14-retro-analog-v2-product-shell.md`      | done                                                        | P1       |
| 15  | `15-premium-ux-master-plan.md`             | in-progress                                                 | P1       |
| 16  | `16-retro-analog-v3-product-grade.md`      | done (batch 4; Phase 5 studio deferred)                     | P0       |
| 17  | `17-handoff-remainder.md`                  | done                                                        | P0       |
| 18  | `18-session-data-layer.md`                 | done                                                        | P0       |
| 19  | `19-creator-suite-vision.md`               | done (strategy locked)                                      | P0       |
| 20  | `20-creator-suite-execution.md` + batches  | done (batches 0–6)                                          | P0       |
| 24  | `24-demo-mode-browser.md`                  | done                                                        | P2       |
| 25  | `25-parallel-subagent-execution.md`        | done (waves A–F code); smoke operator                       | P0       |
| 26  | `20-batch-6-reels.md`                      | done (May 2026)                                             | P2       |
| 27  | `27-upload-concurrency.md`                 | done (May 2026)                                             | P0       |
| 28  | `28-engineering-consensus-may-2026.md`     | in-progress (alignment + backlog)                           | P0       |

## Current focus (May 2026)

**Shipped on `main`:** Creator Suite batches 0–6, parallel waves A–F, demo v1.1, trust/upload policy, CI, brand/OG, **Plan 27** upload pool, **Plan 13 Phase 2** lock/admit + unified `enterStudio`, **Plan 09** export bundles, **Plan 08** Dodo Payments, AI pipeline status/dedup, DB list indexes.

**Operator next (no new code required):**

1. `git push` + `bun run db:migrate`
2. [try-local-smoke.md](../.docs/try-local-smoke.md) — full record → upload → AI → export → studio lock
3. Dodo dashboard: products + `DODO_PRODUCT_*` + webhook URL → `/api/dodo-webhook`

**Next build order:** Locked in [28-engineering-consensus-may-2026.md](28-engineering-consensus-may-2026.md) (grill May 2026). Milestone = **Riverside parity v1**.

1. **Operator** — push, migrate, smoke, Dodo dashboard
2. **[08](08-billing-stripe-subscriptions.md)** — usage caps, trial transcript teaser, export Pro UI gate
3. **[13](13-riverside-competitive-roadmap.md)** — preflight, consent, health, mute/remove, **co-host policy**
4. **[24](24-demo-mode-browser.md)** — browser v1.1 (auto-zoom, PiP, trim/speed, backgrounds)
5. **Worker export** — long session path (Plan 13 Phase 4 slice)
6. **[07](07-multi-track-timeline-editor.md)** — timeline MVP before public beta
7. **[06](06-ai-features-chapters-clips-notes.md)** — regen (after timeline)
8. **Ototabi Capture** — thin desktop companion (spec → MVP)

## Convention

- Status: `pending` → `in-progress` → `done`
- Priority: `P0` (blocking) → `P1` (core) → `P2` (enhancement)
- Each plan is a concise spec: problem, solution, files to change, acceptance criteria

## Design source of truth

- `PRODUCT.md` — users, jobs, anti-references
- `DESIGN.md` — Retro Analog v2/v3 tokens, registers, motion
- `.docs/encyclopedia.md` — domain + design glossary
- `/mockups` — exploratory only; production UI follows Retro Analog
