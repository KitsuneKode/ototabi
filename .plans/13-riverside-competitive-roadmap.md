# Plan 13: Riverside-Competitive Product Roadmap

**Status:** pending  
**Priority:** P0

## Problem

Ototabi has the right product direction for a browser-based podcast studio, but the current implementation is not yet reliable enough to compete with Riverside-class products. The highest-risk gaps are in recording trust, upload authorization, crash recovery, sync accuracy, private media handling, AI workflow robustness, and creator workflow completeness.

The product must not feel like a clone. It should become a trustworthy recording platform first, then use AI-native workflows to make creators faster before, during, and after recording.

## Product North Star

Creators should be able to invite guests, record separate high-quality local tracks, survive crashes and weak networks, produce synced exports, and generate usable clips/show assets with AI without needing a producer or editor.

## Initial Market

- Bootstrap podcasters and new creators who need a simple, trustworthy recording workflow.
- Small creator teams that want high-quality remote recording without hiring a producer/editor.
- Developer and self-host users who care about ownership, privacy, custom workflows, and avoiding vendor lock-in.

## Positioning

Ototabi should not compete as a cheaper Riverside clone. It should compete as an AI-native recording producer that protects every raw track, makes guests easy to onboard, and turns recordings into publishable assets faster.

## Principles

- Reliability before novelty.
- Private media by default.
- Server-authoritative permissions and recording state.
- Local recording remains the source of quality, but server state remains the source of truth.
- AI features must be editable, explainable, and regeneratable.
- Every critical workflow needs a visible status, recovery path, and audit trail.

## Phase 0: Recording Reliability Core

### Goals

- Make recording and upload trustworthy under crash, reconnect, tab close, weak network, and S3 failures.
- Close authorization gaps before adding broader sharing or AI automation.

### Implementation

- Add secure invite links with room code, invite ID, role, expiration, optional email binding, optional max uses, and revoked-at support.
- Require all guest joins to resolve through a server-side invite/room access check before LiveKit token issuance.
- Add server-side `UploadSession` model with `userId`, `sessionId`, `trackSid`, `uploadId`, `s3Key`, `status`, `parts`, `createdAt`, `updatedAt`, and `completedAt`.
- Add `RecordingEvent` model for `START`, `STOP`, `PAUSE`, `RESUME`, `JOIN`, `LEAVE`, `RECONNECT`, `TRACK_PUBLISHED`, `TRACK_UNPUBLISHED`, and `UPLOAD_COMPLETED`.
- Change upload signing and completion so the server resolves upload ownership before issuing signed URLs or completing multipart uploads.
- Change LiveKit token route to authorize room access before issuing a token.
- Use stable user IDs for LiveKit identity and store display names in token metadata/name.
- Fix `MediaRecorder.stop()` handling so final `dataavailable` is awaited before queue flush and multipart completion.
- Extract browser upload recovery into a reusable service used by both studio and recovery console.
- Make OPFS the primary blob source and IndexedDB the metadata/query source, with IndexedDB blob fallback only where needed.
- Store private S3 keys and have workers read via S3 SDK or server-generated signed GET URLs.
- Add upload/session status surfaces that distinguish `recording`, `finalizing`, `uploading`, `recoverable`, `failed`, and `complete`.

### Files to Change

- `packages/store/prisma/schema.prisma`
- `packages/trpc/src/modules/uploads/*`
- `packages/trpc/src/modules/rooms/*`
- `apps/api/src/routes/live-kit-auth.ts`
- `apps/client/lib/recorder/recorder-manager.ts`
- `apps/client/lib/uploader/s3-uploader.ts`
- `apps/client/lib/localDB/opfs-storage.ts`
- `apps/client/app/recovery/page.tsx`
- `apps/client/app/chat/[roomId]/page.tsx`
- `apps/worker/src/processors/transcript.ts`

### Acceptance Criteria

- A user cannot get a LiveKit token for a room unless they are creator, member, invited guest, or valid participant.
- Guest invite links can expire, be revoked, and be scoped to viewer/participant/editor permissions.
- A user cannot sign, list, complete, or retry another user's upload.
- Stopping a recording always persists and uploads the final chunk.
- A browser restart can resume pending uploads from the recovery console without entering the studio.
- Workers can process private media without public object URLs.
- Every session shows clear recovery and upload status.

## Phase 1: Sync And Timeline Truth

### Goals

- Make multi-track recording useful for post-production.
- Build a durable timeline model for AI, export, review, and editing.

### Implementation

- Implement Plan 03 with durable `SyncMarker` records.
- Add chunk-level local monotonic timestamps and wall-clock timestamps.
- Persist recording events from Phase 0 and render them as a session timeline.
- Use a reference track and sync markers to compute track offsets at export time.
- Add drift diagnostics and warnings when track alignment quality is poor.

### Acceptance Criteria

- Export alignment error target is under 50ms for normal sessions.
- Session review shows participant join/leave/reconnect/track events.
- Export refuses or warns on sessions with insufficient sync confidence.

## Phase 2: Production-Grade Studio Controls

### Goals

- Make the studio feel like a real hosted recording tool, not just a video room.

### Implementation

- Add room lock/unlock.
- Add host admit/deny for guests.
- Add host mute request, remove guest, and role-aware controls.
- Add visible recording consent and recording status for all participants.
- Add preflight checks for mic level, camera, browser support, storage quota, network, and upload configuration.
- Add session health panel with per-participant connection, local storage, upload queue, and device status.

### Acceptance Criteria

- Guests cannot enter locked rooms without host approval.
- All participants see recording consent/status before local capture begins.
- Host can identify participants at risk before and during recording.

## Phase 3: AI-Native Post-Production

### Goals

- Convert raw recording into usable creator assets quickly.
- Keep all AI output editable and traceable.

### Implementation

- Harden transcript worker with private media access, retries, status fields, and idempotency.
- Store word-level transcript timestamps and speaker attribution.
- Replace fragile LLM JSON parsing with schema-validated structured output.
- Add editable artifacts: chapters, show notes, title ideas, descriptions, keywords, sponsor blocks, and clip candidates.
- Add clip candidate model with score, rationale, transcript range, layout, and render status.
- Add filler word and silence suggestions as non-destructive edit decisions.

### Acceptance Criteria

- AI jobs can be retried without duplicate artifacts.
- Users can edit/regenerate AI artifacts.
- Clip candidates include why they were selected.
- Text-based edits are represented as edit decisions, not destructive media mutation.

## Phase 4: Export And Distribution Engine

### Goals

- Move from browser-only export to reliable production rendering and distribution.

### Implementation

- Add server/worker export jobs using FFmpeg outside the browser for long sessions.
- Keep browser FFmpeg as a quick local fallback for small edits.
- Add export presets: full episode, audio-only WAV/MP3, vertical clips, square clips, captions burned-in, captions sidecar, YouTube bundle.
- Add review links with permission-scoped downloads.
- Add destination integrations after export reliability is proven.

### Acceptance Criteria

- Long sessions can export without exhausting browser memory.
- Export progress survives page refresh.
- Output files are stored privately and shared via scoped links.

## Phase 5: Market Fit And Differentiation

### Goals

- Compete by being reliable, creator-friendly, self-hostable, and AI-native.

### Differentiators

- AI producer joins the studio as a LiveKit participant or side-panel assistant.
- Live recording coach flags crosstalk, silence, weak answers, clipping, and guest dropouts.
- AI generates follow-up questions and live bookmarks during recording.
- AI companion can answer host requests during recording: find context, draft questions, search notes, play approved stingers/music, send links, and mark moments for editing.
- Workspace memory learns show format, brand voice, recurring speakers, intros, outros, and sponsor copy.
- One-click episode bundle: final episode, clips, captions, show notes, newsletter, YouTube description, social posts.
- Viral clip engine finds high-retention moments, generates vertical/square presets, writes hooks, captions, titles, and platform-specific variants.
- Self-hostable privacy-first deployment for teams that do not want vendor lock-in.

### Acceptance Criteria

- A creator can record and publish a complete episode bundle with minimal manual production work.
- The AI producer produces actionable suggestions during recording, not just post-session summaries.
- Workspace memory improves repeated shows without leaking private media across workspaces.

## Architecture Workstream

- Finish module-first refactor for `uploads`, `rooms`, `transcript`, `recording`, `export`, and `ai` modules.
- Add DTO, mapper, policy, repository, and service files where responsibilities are mixed.
- Convert string statuses and roles to enums.
- Do not return raw Prisma records from tRPC procedures.
- Add structured logging with session ID, room ID, user ID, track SID, upload ID, job ID.
- Add BullMQ observability and graceful shutdown for all worker signals.
- Add idempotency keys for AI and export jobs.

## Testing Workstream

- Unit test permission policies.
- Unit test upload ownership checks.
- Unit test recorder final chunk promise behavior.
- Integration test multipart upload lifecycle.
- Integration test recovery from pending chunks.
- Worker test transcript/LLM idempotency.
- E2E smoke test guest join, host start, local recording, stop, upload complete, transcript queued.

## Rollout Order

1. Phase 0: Recording Reliability Core.
2. Phase 1: Sync And Timeline Truth.
3. Phase 2: Production-Grade Studio Controls.
4. Phase 3: AI-Native Post-Production.
5. Phase 4: Export And Distribution Engine.
6. Phase 5: Market Fit And Differentiation.

## First PR Recommendation

Start with Phase 0 authorization and upload session hardening:

- Add `UploadSession` and upload ownership checks.
- Lock down LiveKit token authorization.
- Fix final chunk completion.
- Extract recovery upload service.

This unlocks trust. Without it, AI and export improvements rest on unreliable media state.
