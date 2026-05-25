# Plans

Each file is a scoped engineering initiative, implementable in one PR.

| #   | File                                       | Status      | Priority |
| --- | ------------------------------------------ | ----------- | -------- |
| 01  | `01-guest-join-no-auth.md`                 | done        | P0       |
| 02  | `02-local-recording-opfs-recovery.md`      | pending     | P0       |
| 03  | `03-sync-markers-livekit-rtp.md`           | in-progress | P1       |
| 04  | `04-transcript-pipeline-whisper.md`        | in-progress | P1       |
| 05  | `05-text-based-editing.md`                 | pending     | P1       |
| 06  | `06-ai-features-chapters-clips-notes.md`   | pending     | P2       |
| 07  | `07-multi-track-timeline-editor.md`        | pending     | P2       |
| 08  | `08-billing-stripe-subscriptions.md`       | pending     | P2       |
| 09  | `09-distribution-youtube-bundles.md`       | pending     | P2       |
| 10  | `10-oxc-migration.md`                      | in-progress | P0       |
| 11  | `11-module-first-architecture-refactor.md` | pending     | P1       |
| 12  | `12-ux-polish-keyboard-animation.md`       | in-progress | P1       |
| 13  | `13-riverside-competitive-roadmap.md`      | in-progress | P0       |
| 14  | `14-retro-analog-v2-product-shell.md`      | done        | P1       |
| 15  | `15-premium-ux-master-plan.md`             | in-progress | P1       |
| 16  | `16-retro-analog-v3-product-grade.md`      | in-progress | P0       |
| 17  | `17-handoff-remainder.md`                  | done        | P0       |

## Current focus (product-grade)

Phases A–F from **Plan 17** are implemented. Next: P2 backlog (Plans 02, 05–11).

1. **Plan 02** — OPFS-primary recovery hardening
2. **Plan 05** — Text-based editing
3. **Plan 07** — Multi-track timeline editor
4. **Plan 03** — LiveKit RTP alignment (markers + export offset shipped; RTP TBD)

## Convention

- Status: `pending` → `in-progress` → `done`
- Priority: `P0` (blocking) → `P1` (core) → `P2` (enhancement)
- Each plan is a concise spec: problem, solution, files to change, acceptance criteria

## Design source of truth

- `PRODUCT.md` — users, jobs, anti-references
- `DESIGN.md` — Retro Analog v2/v3 tokens, registers, motion
- `.docs/encyclopedia.md` — domain + design glossary
- `/mockups` — exploratory only; production UI follows Retro Analog
