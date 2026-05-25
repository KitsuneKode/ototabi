# Creator Suite — Superpowers Execution Protocol

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement batch plans task-by-task. Every batch ends with `superpowers:verification-before-completion`. After all batches: `superpowers:finishing-a-development-branch`.

**Goal:** Ship trust-studio + dashboard + deploy + clips in ordered batches without scope bleed, aligned with [Plan 19](19-creator-suite-vision.md).

**Architecture:** Four lanes share `RecordingSession`, timeline, worker AI, and hybrid export. Year-1 code focuses on Studio trust lane; Demo/Reels gated.

**Tech stack:** Next.js 16, Bun, tRPC 11, Prisma, LiveKit, BullMQ, FFmpeg.wasm + Railway worker FFmpeg, Vercel + Railway.

**Repo plan index:** Strategy = Plan 19. Batches below. Cursor rollup = `product_dashboard_deploy` plan in `.cursor/plans/`.

---

## Superpowers workflow (mandatory)

| Phase   | Skill                                              | When                                                                        |
| ------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Design  | `brainstorming` / grill-me                         | Done May 2026 — decisions in Plan 19                                        |
| Plan    | `writing-plans`                                    | Each batch file (`20-batch-*.md`)                                           |
| Isolate | `using-git-worktrees`                              | Before first code change on `main` (user consent)                           |
| Execute | `executing-plans` or `subagent-driven-development` | Per batch                                                                   |
| Verify  | `verification-before-completion`                   | End of every batch — `bun fmt`, `bun lint`, `bun typecheck`, `bun run test` |
| Finish  | `finishing-a-development-branch`                   | After last batch in a milestone                                             |

**User constraints (override superpowers defaults):**

- Do **not** `git push` unless explicitly asked.
- Plans live in `.plans/` (not `docs/superpowers/plans/`).
- Never `bun test` — use `bun run test`.

---

## Batch map (execute in order)

| Batch | File                                                       | Goal                                                   | Gate before next                        |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| **0** | [20-batch-0-trust.md](20-batch-0-trust.md)                 | Plan 13 Phase 0–1 slice (OPFS, upload auth, sync)      | **done** (May 2026)                     |
| **1** | [20-batch-1-dashboard.md](20-batch-1-dashboard.md)         | Dashboard UX + tRPC perf + `dashboard.getSummary`      | **done**                                |
| **2** | [20-batch-2-deploy.md](20-batch-2-deploy.md)               | Vercel client + Railway API/worker + docs              | **done** (scaffolding; live deploy TBD) |
| **3** | [20-batch-3-ai-clips.md](20-batch-3-ai-clips.md)           | Transcript harden + show notes + magic clips           | **done**                                |
| **4** | [20-batch-4-polish-export.md](20-batch-4-polish-export.md) | Plan 16 landing + hybrid export worker + timeline-lite | **done**                                |
| **5** | [Plan 24](24-demo-mode-browser.md)                         | Browser demo mode                                      | **done** (May 2026)                     |
| **6** | [20-batch-6-reels.md](20-batch-6-reels.md)                 | Native JSON preset packs                               | **done** (May 2026)                     |

---

## Execution choice (pick when starting code)

**1. Subagent-driven (recommended)** — Fresh subagent per task in batch; two-stage review between tasks.

**2. Inline** — Same session, `executing-plans` with checkpoints after each batch.

**Before either:** Run `using-git-worktrees` (or confirm isolated branch). Do not stack all batches on dirty `main` without review.

---

## Verification gate (every batch)

```bash
cd /home/kitsunekode/Projects/ototabi
bun fmt
bun lint
bun typecheck
bun run test
```

Optional smoke (document in batch): host sign-in → dashboard → room → guest join → studio → stop → recordings page.

**Iron law:** No "done" without fresh command output in the session.

---

## Code review checkpoint

After Batch 1, 3, and 4: invoke `superpowers:requesting-code-review` or `code-reviewer` subagent against Plan 19 acceptance criteria.
