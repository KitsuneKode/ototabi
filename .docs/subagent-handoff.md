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

---

## Wave 3 Stream 5 — Demo browser v1.1 (PR5)

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| **Wave / stream** | Wave 3 — Demo browser v1.1             |
| **Branch**        | `feat/parity-stream5-demo` (merged)    |
| **Plan refs**     | Plan 24, parity subagent plan Stream 5 |

### Scope

Shipped grill bundle: auto-zoom suggestion + live preview punch-in, optional webcam PiP capture + FFmpeg overlay export, trim/playback speed in editor store + export pipeline, background blur presets (preview + export). Demo export path on export console uses `demo-export-pipeline.ts` with saved edit metadata.

Out of scope: studio chat, usage module, Capture desktop app.

### Files touched

- `apps/client/lib/demo/` — `demo-export-pipeline.ts`, `demo-zoom-preview.ts`, presets, capture manager webcam track
- `apps/client/lib/stores/demo-editor-store.ts`
- `apps/client/components/demo/demo-editor-preview.tsx`, `demo-cursor-overlay.tsx`
- `apps/client/app/(site)/demo/[sessionId]/edit/page.tsx`, `demo/record/page.tsx`
- `apps/client/app/(site)/export/[sessionId]/page.tsx` (demo export handler)
- `packages/trpc/src/modules/demo/*`, `packages/store/prisma/schema.prisma` + migration `20260526200000_demo_v11_edit_fields`
- `.docs/try-demo-smoke.md`

### Tests added

- `apps/client/lib/demo/suggest-zoom-from-cursor.test.ts`
- `apps/client/lib/demo/demo-background-presets.test.ts`
- `apps/client/lib/demo/demo-export-pipeline.test.ts`

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test`

### Smoke steps

[try-demo-smoke.md](./try-demo-smoke.md)

---

## Wave 3 Stream 6 — Worker export hardening (PR6)

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| **Wave / stream** | Wave 3 — Worker-first session exports        |
| **Branch**        | `feat/parity-stream6-worker-export` (merged) |
| **Plan refs**     | Plan 13 Phase 4 slice, parity plan Stream 6  |

### Scope

Shipped: `export-routing` thresholds (≥30 min or ≥4 tracks → worker); `sessionReview.get` exposes `exports.routing`; stable BullMQ job IDs; `queueSessionExport` on `hostProProcedure` (Pro+).

### Files touched

- `packages/common/src/export-routing.ts`, `export-routing.test.ts`
- `packages/trpc/src/modules/session-review/*`
- `apps/worker/src/processors/export-render.ts`, `export-render.test.ts`

---

## Wave 4 Stream 7 — Timeline MVP (PR7)

| Field             | Value                                               |
| ----------------- | --------------------------------------------------- |
| **Wave / stream** | Wave 4 — Timeline scrub, trim handles, preview sync |
| **Branch**        | `feat/parity-stream7-timeline`                      |
| **Plan refs**     | Plan 07, parity subagent plan Stream 7              |

### Scope

Shipped: `TrackLane`, `PlaybackScrub`, `timeline-math` + tests; extended `TimelineLite`; `ExportTrackPreview` + `useExportTimeline` on export page with playhead ↔ video sync; trim handles sync to existing trim form. Merged `feat/parity-stream2-studio-trust` on top of stream4 baseline so `rooms.service` typechecks.

Out of scope: undo/redo stack v1, waveform canvas, multi-cam switch persistence.

### Files touched

- `apps/client/components/editor/timeline-lite.tsx`, `TrackLane.tsx`, `PlaybackScrub.tsx`, `timeline-math.ts`, `timeline-math.test.ts`, `export-track-preview.tsx`, `recording-timeline-shell.tsx`
- `apps/client/lib/hooks/use-export-timeline.ts`
- `apps/client/lib/stores/export-console-store.ts` (`playheadSec`)
- `apps/client/app/(site)/export/[sessionId]/page.tsx`
- `apps/client/app/(site)/recordings/[sessionId]/page.tsx` (read-only shell)
- `.docs/try-local-smoke.md` §7, `.docs/subagent-handoff.md`

### Tests added

- `apps/client/components/editor/timeline-math.test.ts`

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test` — pass.

### Smoke steps

[try-local-smoke.md](./try-local-smoke.md) §7 — scrub timeline, drag trim handles on active lane, confirm preview video + trim fields update.

---

## Wave 5 Stream 8 — AI regen, deploy doc, Capture spec (PR8)

| Field             | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| **Wave / stream** | Wave 5 — AI regen (Plan 06), staging deploy checklist, Capture spec |
| **Branch**        | `feat/parity-stream8-wave5`                                         |
| **Plan refs**     | `.plans/06`, `.plans/28`, `.plans/29`                               |

### Scope

Shipped: `sessionReview.regenerateLlm` + `updateShowNotes`; pipeline status rail; regen actions on recordings + export; editable show notes summary; `ai-regen.policy` + tests; Capture companion spec (`.plans/29`); parity staging checklist in deploy doc. Playwright scaffold under `e2e/` (manual, not CI gate).

Out of scope: actual Railway deploy (no credentials assumed); Capture desktop app code; filler-word removal UI.

### Files touched

- `packages/trpc/src/lib/ai-pipeline-reset.ts`, `schedule-llm-regen.ts`
- `packages/trpc/src/modules/session-review/` — router, service, dto, `ai-regen.policy.ts` + test
- `apps/client/components/session-review/` — `ai-pipeline-status`, `ai-artifact-actions`, `show-notes-editor`
- `apps/client/app/(site)/recordings/[sessionId]/page.tsx`, `export/[sessionId]/page.tsx`
- `apps/client/lib/hooks/use-session-review.ts`
- `.plans/29-ototabi-capture-companion.md`, `.docs/deploy-railway.md`, `.docs/subagent-handoff.md`
- `e2e/` — Playwright scaffold + README (manual, outside turbo test)

### Tests added / updated

| Package         | Tests                               |
| --------------- | ----------------------------------- |
| `@ototabi/trpc` | `ai-regen.policy.test.ts` (6 cases) |

**Gate:** `bun fmt && bun lint && bun typecheck && bun run test`

### Smoke steps

1. Complete session with transcript → open `/recordings/{id}` → verify pipeline rail (transcript / LLM / clips).
2. **Regenerate chapters & show notes** → chapters/notes refresh after worker (~30s).
3. Edit show notes summary → Save → reload persists.
4. **Regenerate clip candidates** (Creator+) → new clip rows appear.
5. Repeat regen + show notes on `/export/{id}`.
6. Staging: follow `.docs/deploy-railway.md` §4 parity checklist when credentials available.

### Blockers / merge recommendation

| Item          | Detail                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| Merge to main | Merge `feat/parity-stream8-wave5` into `main` (all parity streams integrated on this branch) |
| E2E           | Run `e2e/` only with live preview URL; keep out of `bun run check` until CI job added        |
| Capture app   | Spec only — implementation tracked in Plan 29 (~6–8w)                                        |

---

## Integration branch (`feat/parity-stream8-wave5`)

All parity streams **1, 2, 3, 4, 5 (demo), 6 (worker), 7, 8** are merged into this branch. Merge to `main` after `bun run check` and `bun run db:migrate`.
