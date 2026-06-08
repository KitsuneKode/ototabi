# Production Hardening Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for parallel-safe slices or `superpowers:executing-plans` for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Ototabi from a feature-rich local product into a production-grade recording suite with truthful plans, reliable media flows, clean package boundaries, polished UX, and scalable feature lanes.

**Architecture:** Stabilize first, expand second. The plan starts with doc/code truth, gates, and smoke validation, then fixes the highest-risk runtime path: multi-track sync/export. After that, it splits overloaded modules and pages so future features land in clean package boundaries instead of growing the current large files.

**Tech Stack:** Next.js 16, React 19, tRPC 11, Express on Bun, Prisma 7, PostgreSQL, Better Auth, LiveKit, S3/MinIO multipart uploads, BullMQ/Redis workers, FFmpeg.wasm/browser export, server FFmpeg worker export, Tailwind CSS v4, shadcn/ui source components.

---

## Scope Decision

This is not one implementation PR. It is a production program split into PR-sized plans. Each PR must pass:

```bash
bun fmt
bun run db:format:check
bun lint
bun typecheck
bun run test
```

Do not use `bun test`. This repo requires `bun run test`.

## Current Truth Snapshot

The following are already substantially landed and should be documented as such after one smoke pass:

- Guest join, invite links, lock/admit, co-host controls, consent, preflight, and studio health.
- Local recording, OPFS/IndexedDB recovery, upload ownership, signed media access, and upload worker pool.
- Whisper transcript, LLM show notes/chapters, clip candidates, retry/regenerate controls, and pipeline status.
- Dodo checkout/webhook, plan gates, trial transcript teaser, trial session cap, Creator clip cap, and Pro text-edit UI gating.
- Browser demo v1.1, export bundles, reels presets, and timeline MVP controls.

The following remain production-risk items:

- Pre-PR0 baseline: Plan 28, Plan 30, and `.plans/README.md` disagreed on what was landed and what v1.1 should build. PR0 resolves this by making Plan 28 the parity-v1 consensus record, Plan 30 a v1.1 scope proposal, and this Plan 31 the operational hardening order.
- Sync markers are present, but export still uses a naive global first-marker offset instead of per-track alignment.
- `rooms` owns too many separate domains.
- `export/[sessionId]/page.tsx` owns too many workflows.
- UI polish is strong visually, but focus states, native controls, tab semantics, and export-state clarity need production accessibility polish.
- Clean staging smoke and Pro dogfood are still required before public beta confidence.

---

## Target Architecture

### Backend Package Boundaries

```text
packages/trpc/src/modules/
  rooms/
    rooms.router.ts
    rooms.service.ts
    rooms.repository.ts
    rooms.policy.ts
    rooms.dto.ts
    rooms.mapper.ts

  studio-access/
    studio-access.router.ts
    studio-access.service.ts
    studio-access.repository.ts
    studio-access.policy.ts
    studio-access.dto.ts
    studio-access.mapper.ts

  recordings/
    recordings.router.ts
    recordings.service.ts
    recordings.repository.ts
    recordings.policy.ts
    recordings.dto.ts
    recordings.mapper.ts

  sync-markers/
    sync-markers.router.ts
    sync-markers.service.ts
    sync-markers.repository.ts
    sync-markers.dto.ts

  exports/
    exports.router.ts
    exports.service.ts
    exports.repository.ts
    exports.policy.ts
    exports.dto.ts
    exports.mapper.ts
```

Rules:

- Routers bind procedures only.
- Services own business behavior and orchestration.
- Repositories own Prisma queries only.
- Policies own pure permission decisions.
- Mappers own API-safe response shapes.
- DTO files own Zod schemas and exported input/output types.
- Do not return raw Prisma models directly from public procedures.

### Shared Logic Boundaries

```text
packages/common/src/
  sync-alignment.ts
  export-routing.ts
  reels-presets.ts
  pipeline-status.ts

apps/client/lib/
  export/browser-ffmpeg.ts
  export/browser-export-commands.ts
  studio/sync-marker-publisher.ts
  studio/readiness.ts

apps/worker/src/
  processors/export-render.ts
```

Rules:

- Sync math lives in `packages/common` so browser export and worker export use identical alignment behavior.
- Browser-only FFmpeg loading and Blob download behavior stays in `apps/client`.
- Worker-only filesystem/S3 behavior stays in `apps/worker` and `packages/backend-common`.
- UI panels stay in `apps/client/components`.

---

## PR 0: Plan Truth, Formatting, and Gate Baseline

**Goal:** Make docs match the code and restore a clean baseline before implementation.

**Files:**

- Modify: `.plans/README.md`
- Modify: `.plans/28-engineering-consensus-may-2026.md`
- Modify: `.plans/30-v1.1-execution-brief.md`
- Modify: `.docs/try-local-smoke.md`
- Modify: `.docs/try-billing-smoke.md`
- Modify: `.docs/try-studio-trust-smoke.md`

### Tasks

- [ ] Format `.plans/30-v1.1-execution-brief.md`.

  Run:

  ```bash
  bun fmt
  ```

  Expected: oxfmt rewrites the unformatted markdown and exits successfully.

- [ ] Update `.plans/README.md` so landed items match code reality.

  Required status changes:
  - Plan 08: mark usage caps and export Pro UI gate landed, with staging smoke pending.
  - Plan 12: mark as in-progress only if polish issues remain; otherwise mark done after UI sweep.
  - Plan 13: mark preflight, consent, health, mute/remove, and co-host policy landed, with smoke pending.
  - Plan 24: keep done.
  - Plan 28: mark as superseded by Plan 31 for execution order.
  - Plan 30: mark as draft v1.1 scope proposal, not current execution source until reconciled.
  - Plan 31: add as current production-hardening master plan.

- [ ] Reconcile Plan 28 and Plan 30.

  Decision to record:
  - Plan 28 remains the parity-v1 consensus record.
  - Plan 30 remains a v1.1 scope proposal.
  - Plan 31 is the operational execution order for hardening and architecture.
  - Deferred features may be planned, but not built before sync/export and architecture cleanup.

- [ ] Run the full gate.

  Run:

  ```bash
  bun fmt
  bun run db:format:check
  bun lint
  bun typecheck
  bun run test
  ```

  Expected: all commands pass. Lint warnings are acceptable only if the command exits 0 and the warning is logged into the follow-up cleanup list.

- [ ] Create or update a smoke log section in `.docs/try-local-smoke.md`.

  Required smoke path:
  - Host signs in.
  - Host creates room.
  - Guest joins by invite link.
  - Preflight runs.
  - Consent is acknowledged before recording.
  - Host starts recording.
  - Tracks upload.
  - Transcript queues or returns plan-upgrade state truthfully.
  - Clips render or return plan-upgrade state truthfully.
  - Export bundle downloads.
  - Recovery page shows no stranded chunks after success.

---

## PR 1: P0 Sync Alignment Foundation

**Goal:** Replace the naive global sync offset with shared per-track alignment math.

**Files:**

- Create: `packages/common/src/sync-alignment.ts`
- Create: `packages/common/src/sync-alignment.test.ts`
- Modify: `packages/common/src/index.ts`
- Modify: `apps/client/lib/merge-session-timeline.ts`
- Modify: `apps/client/lib/merge-session-timeline.test.ts`

### Required Types

`packages/common/src/sync-alignment.ts` must export:

```ts
export type SyncMarkerPoint = {
  id: string;
  userId?: string | null;
  trackSid?: string | null;
  localTime: number;
  rtpTimestamp?: number | null;
  createdAt?: Date | string;
};

export type TrackAlignmentInput = {
  trackSid: string;
  userId?: string | null;
  markers: SyncMarkerPoint[];
};

export type TrackAlignmentOffset = {
  trackSid: string;
  offsetMs: number;
  confidence: "high" | "medium" | "low" | "none";
  markerCount: number;
  reason: string;
};

export type SyncAlignmentResult = {
  referenceTrackSid: string | null;
  offsets: TrackAlignmentOffset[];
  warnings: string[];
};
```

Required functions:

```ts
export function chooseReferenceTrack(tracks: TrackAlignmentInput[]): string | null;

export function computeTrackAlignmentOffsets(tracks: TrackAlignmentInput[]): SyncAlignmentResult;
```

### Tests

- [ ] Test reference track selection.

  Expected:
  - Prefer the track with at least 3 RTP-backed markers.
  - Fall back to the track with the most local-only markers.
  - Return `null` when no track has markers.

- [ ] Test no-marker warning.

  Expected:
  - `referenceTrackSid` is `null`.
  - every track offset is `0`.
  - confidence is `none`.
  - warnings include missing sync coverage.

- [ ] Test local-only offset.

  Fixture:
  - Reference track first marker local time: `1000`.
  - Guest track first marker local time: `1250`.

  Expected:
  - Guest offset is `250`.
  - confidence is `medium` when 3 or more markers exist.

- [ ] Test RTP-backed offset.

  Fixture:
  - Reference RTP baseline maps to local `1000`.
  - Guest RTP baseline maps to local `1060`.

  Expected:
  - Guest offset is within `5ms` of `60`.
  - confidence is `high`.

Run:

```bash
bun run test packages/common/src/sync-alignment.test.ts
```

Expected: tests pass.

---

## PR 2: RTP Capture and Sync Marker Publisher

**Goal:** Centralize sync marker publishing and include `trackSid` and RTP timestamp when available.

**Files:**

- Create: `apps/client/lib/studio/sync-marker-publisher.ts`
- Create: `apps/client/lib/studio/sync-marker-publisher.test.ts`
- Modify: `apps/client/app/(site)/chat/[roomId]/page.tsx`
- Modify: `.docs/try-local-smoke.md`

### Required Module Shape

`sync-marker-publisher.ts` must export:

```ts
export type PublishSyncMarkerInput = {
  sessionId: string;
  localTime: number;
  trackSid?: string;
  rtpTimestamp?: number;
};

export type SyncMarkerSubmitter = (input: PublishSyncMarkerInput) => void;

export type SyncMarkerDataPublisher = (payload: Uint8Array) => Promise<void>;

export function encodeSyncMarkerPayload(input: PublishSyncMarkerInput): Uint8Array;

export function publishSyncMarker(params: {
  input: PublishSyncMarkerInput;
  submit: SyncMarkerSubmitter;
  publishData: SyncMarkerDataPublisher;
}): Promise<void>;
```

### Tasks

- [ ] Move marker payload encoding out of `chat/[roomId]/page.tsx`.
- [ ] Submit `trackSid` when a primary local audio track can be resolved.
- [ ] Submit `rtpTimestamp` when LiveKit/browser stats expose it.
- [ ] Keep local-only marker behavior when RTP cannot be read.
- [ ] Update smoke docs to verify marker coverage on a 2-participant session.

Run:

```bash
bun run test apps/client/lib/studio/sync-marker-publisher.test.ts
bun typecheck
```

Expected: tests and typecheck pass.

---

## PR 3: Browser and Worker Export Use Shared Sync Offsets

**Goal:** Browser export and worker export apply the same per-track alignment decisions.

**Files:**

- Modify: `apps/client/app/(site)/export/[sessionId]/page.tsx`
- Create: `apps/client/lib/export/browser-export-commands.ts`
- Create: `apps/client/lib/export/browser-export-commands.test.ts`
- Modify: `apps/worker/src/processors/export-render.ts`
- Modify: `apps/worker/src/processors/export-render.test.ts`
- Modify: `.docs/try-local-smoke.md`

### Required Behavior

- Browser merge displays a per-track offset summary.
- Browser merge applies offsets to each track.
- Worker export applies offsets to each track.
- Warnings remain visible when coverage is low.
- Missing RTP falls back to local marker confidence.

### Required Tests

- [ ] Browser FFmpeg command test: 2 tracks with guest offset `250ms` includes per-track delay/trim behavior.
- [ ] Worker export test: same fixture produces same offset decisions as browser path.
- [ ] Warning test: one uncovered track shows low-confidence export warning.

Run:

```bash
bun run test packages/common/src/sync-alignment.test.ts
bun run test apps/client/lib/export/browser-export-commands.test.ts
bun run test apps/worker/src/processors/export-render.test.ts
bun typecheck
```

Expected: all pass.

---

## PR 4: Split Rooms, Studio Access, and Recordings

**Goal:** Make backend ownership obvious and scalable.

**Files:**

- Create: `packages/trpc/src/modules/studio-access/studio-access.dto.ts`
- Create: `packages/trpc/src/modules/studio-access/studio-access.router.ts`
- Create: `packages/trpc/src/modules/studio-access/studio-access.service.ts`
- Create: `packages/trpc/src/modules/studio-access/studio-access.repository.ts`
- Create: `packages/trpc/src/modules/studio-access/studio-access.policy.ts`
- Create: `packages/trpc/src/modules/recordings/recordings.dto.ts`
- Create: `packages/trpc/src/modules/recordings/recordings.router.ts`
- Create: `packages/trpc/src/modules/recordings/recordings.service.ts`
- Create: `packages/trpc/src/modules/recordings/recordings.repository.ts`
- Create: `packages/trpc/src/modules/recordings/recordings.policy.ts`
- Modify: `packages/trpc/src/modules/rooms/rooms.router.ts`
- Modify: `packages/trpc/src/modules/rooms/rooms.service.ts`
- Modify: `packages/trpc/src/modules/rooms/rooms.repository.ts`
- Modify: `packages/trpc/src/routers/_app.ts`
- Modify: affected client tRPC call sites.

### Procedure Ownership

Move these from `rooms` to `studioAccess`:

- `createInvite`
- `listInvites`
- `revokeInvite`
- `validateInvite`
- `joinRoom`
- `lockRoom`
- `unlockRoom`
- `listJoinRequests`
- `admitJoinRequest`
- `denyJoinRequest`
- `leaveRoom`
- `getRoomParticipants`
- `getStudioContext`
- `getStudioHealth`
- `acknowledgeRecordingConsent`
- `removeGuest`
- `requestParticipantMute`

Move these from `rooms` to `recordings`:

- `startRecordingSession`
- `stopRecordingSession`
- `getRecordingSessions`
- `getRecordingSessionById`
- `listRecentSessions`

Keep these in `rooms`:

- `createRoom`
- `updateRoom`
- `deleteRoom`
- `getRoom`
- `getRoomByCode`
- `listRooms`
- `listSharedRooms`
- `inviteMember`
- `removeMember`
- `getRoomMembers`

### Compatibility Rule

During this PR, update client calls to the new namespaces instead of keeping compatibility aliases. Avoid long-term duplicate procedures.

Run:

```bash
bun run test packages/trpc/src/modules/rooms/rooms.policy.test.ts
bun run test packages/trpc/src/modules/rooms/enter-studio.test.ts
bun typecheck
```

Expected: tests and typecheck pass.

---

## PR 5: Export Page Decomposition

**Goal:** Keep `/export/[sessionId]` readable by moving workflows into panels and libraries.

**Files:**

- Modify: `apps/client/app/(site)/export/[sessionId]/page.tsx`
- Create: `apps/client/components/export/text-edit-panel.tsx`
- Create: `apps/client/components/export/browser-export-panel.tsx`
- Create: `apps/client/components/export/sync-alignment-panel.tsx`
- Create: `apps/client/components/export/export-processing-panel.tsx`
- Create: `apps/client/lib/export/browser-ffmpeg.ts`
- Create: `apps/client/lib/export/browser-export-commands.ts`
- Create: `apps/client/lib/export/browser-export-commands.test.ts`

### Target Result

- `export/[sessionId]/page.tsx` should primarily compose data hooks and panels.
- FFmpeg loading and command construction should not live inline in the page.
- Text editing should not know about unrelated demo export or session bundle export.
- Sync warnings should be rendered by a dedicated panel.

### Guardrails

- Preserve existing UX and routes.
- Do not change billing behavior.
- Do not change export file naming unless tests document the new names.
- Keep browser export independent of worker availability.

Run:

```bash
bun run test apps/client/lib/cut-preview.test.ts
bun run test apps/client/lib/export/browser-export-commands.test.ts
bun typecheck
```

Expected: tests and typecheck pass.

---

## PR 6: Production UX and Accessibility Sweep

**Goal:** Make primary workflows feel trustworthy and accessible.

**Files:**

- Modify: `apps/client/app/(site)/rooms/[roomId]/join/page.tsx`
- Modify: `apps/client/app/(site)/chat/[roomId]/preflight/page.tsx`
- Modify: `apps/client/app/(site)/chat/[roomId]/page.tsx`
- Modify: `apps/client/app/(site)/export/[sessionId]/page.tsx`
- Modify: `apps/client/components/editor/transcript-editor.tsx`
- Modify: `apps/client/components/layout/app-shell.tsx`
- Modify: `apps/client/components/studio/studio-health-panel.tsx`
- Modify: `apps/client/components/studio/studio-participant-roster.tsx`
- Modify: `apps/client/components/ui/retro-primitives.tsx`
- Modify: `packages/ui/src/styles/globals.css`

### Required Fixes

- [ ] Add `type="button"` to non-submit raw buttons.
- [ ] Replace raw tab buttons with accessible tab semantics in studio sidebar and dashboard filters.
- [ ] Replace `transition-all` with explicit transition properties.
- [ ] Replace `focus:outline-none` with `focus-visible` rings or remove it.
- [ ] Ensure icon-only buttons have `aria-label`.
- [ ] Ensure interactive segmented controls use button/toggle semantics, not clickable decorative divs.
- [ ] Add disabled reason text for export buttons when tracks, billing, FFmpeg, or upload state blocks action.
- [ ] Keep recovery states truthful: show local pending chunks, failed chunks, and successful drain states separately.

### Manual UX Smoke

- [ ] Keyboard-only: dashboard → room settings → join → preflight → studio → export.
- [ ] Narrow viewport: join, studio, export, and recovery remain usable.
- [ ] Reduced motion: core interactions still work without essential animation.
- [ ] Screen reader sanity: buttons and tabs announce meaningful labels.

Run:

```bash
bun lint
bun typecheck
```

Expected: both pass.

---

## PR 7: Worker Export and Long Session Reliability

**Goal:** Make long-session export predictable under failures.

**Files:**

- Modify: `apps/worker/src/processors/export-render.ts`
- Modify: `apps/worker/src/processors/export-render.test.ts`
- Modify: `packages/trpc/src/modules/session-review/session-review.service.ts`
- Modify: `packages/trpc/src/modules/exports/exports.service.ts`
- Modify: `.docs/try-local-smoke.md`

### Required Behavior

- Worker export uses signed/S3 SDK reads, not public URLs.
- Worker export marks each asset status as `processing`, `ready`, or `failed` with user-facing error text.
- Re-queue is idempotent for the same session/preset.
- Browser export remains available when worker export fails.
- Failed worker export can be retried without duplicating stale records.

Run:

```bash
bun run test apps/worker/src/processors/export-render.test.ts
bun run test packages/trpc/src/modules/exports/exports.policy.test.ts
bun typecheck
```

Expected: tests and typecheck pass.

---

## PR 8: Database Status Enums and Mapper Cleanup

**Goal:** Reduce stringly typed status drift.

**Files:**

- Modify: `packages/store/prisma/schema.prisma`
- Add migration under: `packages/store/prisma/migrations/`
- Modify: mappers in `packages/trpc/src/modules/session-review/`
- Modify: mappers in `packages/trpc/src/modules/exports/`
- Modify: worker processors that write statuses.

### Target Enums

Add Prisma enums for:

- `RecordingSessionStatus`
- `RecordingMode`
- `TrackStatus`
- `UploadStatus`
- `PipelineStatus`
- `ClipRenderStatus`
- `StudioJoinRequestStatus`

### Migration Rule

Use a forward-only migration that maps existing string values to enum values. Keep API response mappers stable so clients do not need to know Prisma enum internals.

Run:

```bash
bun run db:format:check
bun run db:migrate
bun typecheck
bun run test
```

Expected: migration applies locally and tests pass.

---

## PR 9: Staging, Observability, and Operator Runbook

**Goal:** Make production operation repeatable.

**Files:**

- Modify: `.docs/deploy-railway.md`
- Modify: `.docs/ci.md`
- Modify: `.docs/quick-start.md`
- Modify: `.docs/try-local-smoke.md`
- Modify: `.docs/try-recovery-smoke.md`
- Modify: `apps/api/src/app.ts`
- Modify: `packages/common/src/utils/logger.ts`

### Required Operational Checks

- [ ] API health endpoint covers database, Redis, S3/MinIO configuration, and LiveKit env presence.
- [ ] Worker startup logs queue readiness.
- [ ] Upload failures log session ID, track SID, part number, and S3 key.
- [ ] Export failures log job ID, session ID, preset, and safe error message.
- [ ] Docs explain Vercel client, Railway API, Railway worker, Postgres, Redis, and MinIO/R2 envs.

Run:

```bash
bun lint
bun typecheck
```

Expected: both pass.

Manual staging smoke:

- [ ] Create Trial user.
- [ ] Verify transcript teaser blocks after the lifetime allowance.
- [ ] Verify Trial session cap blocks after 3 completed sessions when billing env is configured.
- [ ] Verify Creator clip cap blocks at monthly limit.
- [ ] Verify Pro host can complete the full record → AI → export flow.

---

## PR 10: Feature Expansion Planning Gate

**Goal:** Prevent future feature bloat from re-damaging architecture.

**Files:**

- Modify: `.plans/30-v1.1-execution-brief.md`
- Create: `.plans/32-v1.1-feature-expansion-plan.md`

### Feature Order After Hardening

Only start these after PR 0 through PR 9 are complete or explicitly waived:

1. Timeline waveforms and undo stack.
2. AI artifact editing and regeneration polish.
3. Reels composer and batch export.
4. Workspace memory.
5. In-room AI producer.
6. Podcast hosting lite.
7. Live multistream.

### Required Rule For Each Feature

Every feature plan must include:

- Target user workflow.
- Package/module ownership.
- Data model changes.
- tRPC procedure boundaries.
- UI states.
- Failure states.
- Billing/plan behavior.
- Tests.
- Manual smoke path.
- Explicit non-goals.

---

## Final Production Definition of Done

Ototabi is production-ready when all of these are true:

- [ ] `.plans/README.md`, Plan 28, Plan 30, and Plan 31 do not contradict each other.
- [ ] Full gate passes: `bun fmt`, `bun run db:format:check`, `bun lint`, `bun typecheck`, `bun run test`.
- [ ] Clean-machine local smoke passes.
- [ ] Staging smoke passes with real envs.
- [ ] Pro dogfood completes: 2 participants → record → upload → transcript → chapters/show notes → clips → reels preset → browser export → worker export bundle.
- [ ] Tab-kill recovery smoke proves pending chunks can be retried.
- [ ] Multi-track export uses per-track sync offsets or shows truthful low-confidence warnings.
- [ ] Main backend domains have module-first boundaries.
- [ ] Export page is decomposed into focused panels and library modules.
- [ ] Primary UI flows are keyboard-usable and do not hide disabled reasons.
- [ ] No public media URLs are required in production.
- [ ] Worker failures are visible, retryable, and do not corrupt session state.

## Recommended Execution Mode

Use subagent-driven development for PRs that can be isolated:

- PR 0: docs and gate baseline.
- PR 1: sync-alignment pure module.
- PR 6: UX/accessibility sweep.
- PR 9: docs/operator runbook.

Use inline execution or one owner for PRs with many cross-file call-site updates:

- PR 2: LiveKit studio sync publisher.
- PR 3: browser + worker export wiring.
- PR 4: tRPC namespace split.
- PR 5: export page decomposition.
- PR 8: Prisma enum migration.

## First Three Commits

Recommended starting commits:

```bash
git add .plans/31-production-hardening-master-plan.md .plans/README.md .plans/28-engineering-consensus-may-2026.md .plans/30-v1.1-execution-brief.md
git commit -m "docs: reconcile production hardening plan"
```

```bash
git add packages/common/src/sync-alignment.ts packages/common/src/sync-alignment.test.ts packages/common/src/index.ts
git commit -m "feat(common): add sync alignment foundation"
```

```bash
git add apps/client/lib/studio/sync-marker-publisher.ts apps/client/lib/studio/sync-marker-publisher.test.ts apps/client/app/\(site\)/chat/\[roomId\]/page.tsx
git commit -m "feat(studio): centralize sync marker publishing"
```
