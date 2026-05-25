    AI[Stream C AI plus worker]
    Deploy[Stream A Platform]

end
subgraph wave2 [Wave 2 Parallel]
Edit[Stream D Plan 05 editor]
Demo[Stream E Demo v1.1]
end
subgraph wave3 [Wave 3]
Reels[Stream F Batch 6 reels]
end
wave0 --> wave1
wave1 --> wave2
wave2 --> wave3

```

---

## Shared rules (every sub-agent)

| Rule | Detail |
|------|--------|
| Verification | `bun run check` before claiming done ([`package.json`](package.json)) |
| Branches | `feat/<stream>-<short-topic>` off latest `main`; no direct multi-stream edits on one branch |
| Module ownership | One stream per tRPC module per wave (avoid two agents on `session-review` / `uploads` simultaneously) |
| DTO freeze | Stream C owns [`packages/trpc/src/modules/session-review/`](packages/trpc/src/modules/session-review/); Stream D only consumes types until C merges |
| Commits | Coordinator or stream owner commits; user pushes when ready |
| Docs | Each stream updates one smoke doc: [`.docs/try-ai-pipeline.md`](.docs/try-ai-pipeline.md), [`.docs/quick-start.md`](.docs/quick-start.md), or new `.docs/try-<lane>.md` |

**Integration contract (do not break):**

- `RecordingSession.mode`: `STUDIO` \| `DEMO` — same review/export paths
- Track completion: `status === COMPLETED` + `s3Key`/`s3Url` before AI/export jobs
- S3 keys: [`packages/backend-common/src/s3-media.ts`](packages/backend-common/src/s3-media.ts) (`buildClipRenderKey`, `buildObjectKey`)
- Worker queues: `transcript` → `llm` → `clips`; `export` for renders ([`apps/worker/src/processors/`](apps/worker/src/processors/))

---

## Wave 0 — Coordinator (1 agent, serial, blocks all)

**Sub-agent:** `shell` + `ci-investigator` after push.

**Goal:** Prove the spine works on shared infra.

| Step | Action |
|------|--------|
| 1 | Push `main` (2 local commits + any plan doc commit) |
| 2 | `gh run watch` until [`.github/workflows/ci.yml`](.github/workflows/ci.yml) passes (`bun run db:generate`, `bunx turbo` typecheck/build, `bun run test`) |
| 3 | Staging deploy per [`.docs/deploy-railway.md`](.docs/deploy-railway.md): Vercel preview + Railway API/worker + Postgres/Redis/S3 |
| 4 | Smoke: sign-in → room → record → `/recordings/{id}` → transcript/clips → queue 9:16 → download ([`.docs/try-ai-pipeline.md`](.docs/try-ai-pipeline.md)) |

**Done when:** CI green + one full studio+AI path on staging URLs.

**Default scope:** staging/preview only (no production promotion unless you explicitly expand Stream A).

---

## Wave 1 — Three parallel streams

### Stream A — Platform / deploy (`deployment-expert`)

**Owns:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml), [`apps/client/vercel.json`](apps/client/vercel.json), Dockerfiles, [`.docs/deploy-railway.md`](.docs/deploy-railway.md), env matrix in [`.env.example`](.env.example).

**Tasks (from [`.plans/20-batch-2-deploy.md`](.plans/20-batch-2-deploy.md) unchecked items):**

- Close deploy checklist: `ALLOWED_ORIGINS`, `BETTER_AUTH_URL` = Vercel origin, `NEXT_PUBLIC_API_URL` = Railway API
- Optional: CI job `bunx turbo run build --filter=@ototabi/client` (catches prerender regressions like [`site-footer.tsx`](apps/client/components/layout/site-footer.tsx))
- Staging env var doc + `railway run bun run db:deploy` verification

**Does not touch:** studio UI, worker processors.

---

### Stream B — Trust audit (`explore` then `generalPurpose`)

**Owns:** Plan 13 Phase 0–2 gaps — [`recorder-manager.ts`](apps/client/lib/recorder/recorder-manager.ts), [`upload-recovery.ts`](apps/client/lib/uploader/upload-recovery.ts), [`recovery/page.tsx`](apps/client/app/recovery/page.tsx), [`uploads`](packages/trpc/src/modules/uploads/), LiveKit auth [`apps/api/src/routes/live-kit-auth.ts`](apps/api/src/routes/live-kit-auth.ts).

**Tasks:**

- Audit Batch 0 acceptance vs code ([`.plans/20-batch-0-trust.md`](.plans/20-batch-0-trust.md)); fix any drift (final chunk await, cross-user upload deny)
- Manual smoke script: tab-kill mid-record → recovery → upload complete
- Phase 1 slice if small: sync marker warnings on export ([`merge-session-timeline.ts`](apps/client/lib/merge-session-timeline.ts), export offset already wired)
- Update [`.plans/02-local-recording-opfs-recovery.md`](.plans/02-local-recording-opfs-recovery.md) status to `done` if audit passes

**Gate for Wave 2:** no schema changes to `RecordingTrack` without notifying Stream C.

---

### Stream C — AI + worker hardening (`generalPurpose`)

**Owns:** [`apps/worker/src/processors/`](apps/worker/src/processors/), [`session-review`](packages/trpc/src/modules/session-review/), [`clips`](packages/trpc/src/modules/clips/), client polling [`use-session-review.ts`](apps/client/lib/hooks/use-session-review.ts), [`clip-render-actions.tsx`](apps/client/components/clips/clip-render-actions.tsx).

**Tasks:**

- **Episode export:** implement real render in [`export-render.ts`](apps/worker/src/processors/export-render.ts) for `episode_mp3` / landscape (today logs and returns `queued` when no `clipId`)
- Job failure visibility: `renderStatus: failed` + user-facing message on review/export
- Transcript re-queue edge cases (stop before upload complete, retry button)
- Staging smoke doc updates in [`.docs/try-ai-pipeline.md`](.docs/try-ai-pipeline.md)

**Freeze before merge:** `sessionReview.get` response shape documented in [`session-review.dto.ts`](packages/trpc/src/modules/session-review/session-review.dto.ts).

---

## Wave 2 — Two parallel streams (after Wave 1 merge + DTO freeze)

### Stream D — Plan 05 text editing (`generalPurpose`)

**Owns:** [`apps/client/app/export/[sessionId]/page.tsx`](apps/client/app/export/[sessionId]/page.tsx), [`transcript-editor.tsx`](apps/client/components/editor/transcript-editor.tsx), [`export-console-store.ts`](apps/client/lib/stores/export-console-store.ts).

**Gap vs [Plan 05](.plans/05-text-based-editing.md):**

| Criterion | Today | Target |
|-----------|-------|--------|
| Select transcript → cut | Partial (`cutSegmentIds`, `handleCuts`) | Wire `TranscriptEditor` to store |
| Preview cut | Missing | `onPreviewRange` + ffmpeg preview or time-range highlight |
| Multi-track cut | Single source track in `handleCuts` | Apply cuts to selected tracks |
| UX | Export page only | Optional surface on [`recordings/[sessionId]/page.tsx`](apps/client/app/recordings/[sessionId]/page.tsx) |

**Does not:** change worker or Prisma.

---

### Stream E — Demo v1.1 (`generalPurpose`)

**Owns:** [`apps/client/lib/demo/`](apps/client/lib/demo/), [`apps/client/app/demo/`](apps/client/app/demo/), [`packages/trpc/src/modules/demo/`](packages/trpc/src/modules/demo/).

**Tasks (from [Plan 24 deferred](.plans/24-demo-mode-browser.md)):**

- Auto-zoom suggestions from cursor clusters (heuristic, manual confirm in editor)
- Optional: cursor overlay in ffmpeg export path (browser wasm first)
- Limits/docs on [`/demo`](apps/client/app/demo/page.tsx)

**Does not:** fork session model; uses existing `DemoSessionData`.

---

## Wave 3 — Reels (serial, after clips stable on staging)

### Stream F — Batch 6 reels (`generalPurpose` + `ai-architect` for preset schema)

**Create:** [`.plans/20-batch-6-reels.md`](.plans/20-batch-6-reels.md) (spec file does not exist yet).

**Scope:**

- Native JSON preset packs (caption style, safe zones, 9:16 template params)
- Worker render step consuming `clipId` + `presetId`
- UI: pick preset on recordings/export after clip `ready`

**Depends on:** Stream C clip pipeline green on staging.

---

## How to run sub-agents in Cursor

**Pattern:** Parent agent dispatches **one Task per stream** with a copy-paste brief:

```

You own Stream <X> only. Branch: feat/<x>-<topic>.
Read: <plan files>. Touch only: <file globs>.
Do not modify: <other streams' modules>.
Done when: <acceptance> + bun run check output.
Return: PR summary, files changed, smoke steps, blockers.

```

**Recommended dispatch (Wave 1):**

| Agent type | Stream |
|------------|--------|
| `deployment-expert` | A |
| `explore` (readonly audit) → `generalPurpose` | B |
| `generalPurpose` | C |

**After each wave:** `requesting-code-review` / parent runs `bun run check` + merge to `main`.

**Worktrees (optional):** `using-git-worktrees` skill — one worktree per stream if avoiding branch contention on one machine.

---

## Deferred (explicitly out of this wave)

- Plan 08 billing / Polar production
- Plan 09 distribution
- Plan 16 Phase 5 studio cockpit polish
- Plan 13 Phase 2 full (room lock, admit/deny) — large; slice only if Stream B has capacity
- Production promotion (unless you expand Stream A scope)

---

## Deliverable: plan doc in repo

Add [`.plans/25-parallel-subagent-execution.md`](.plans/25-parallel-subagent-execution.md) mirroring this doc + link from [`.plans/README.md`](.plans/README.md) so every sub-agent has a single entrypoint.

---

## Success definition

| Milestone | Evidence |
|-----------|----------|
| M0 Integration | CI green on GitHub; staging smoke doc signed off |
| M1 Trust + AI | Recovery smoke + 9:16 download on staging |
| M2 Creator UX | Plan 05 preview/cuts + demo v1.1 auto-zoom |
| M3 Reels | Preset render + download on staging |
```
