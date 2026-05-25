# Plan 09: Distribution — Export bundles & selective downloads

**Status:** done (v1, May 2026) — selective export + ZIP via `packages/trpc/src/modules/exports/`  
**Priority:** P2  
**Deferred:** YouTube OAuth and embed player.

## Problem

After recording, creators need packaged deliverables (tracks, merged masters, layout variants) without manual file hunting. Platform publish integrations add OAuth/legal surface area we are not taking yet.

## In scope (v1)

### Selective session export (primary UX)

On `/export/[sessionId]` and `/recordings/[sessionId]`:

- **Pick what to download** — per-track raw, merged timeline, layout variants (9:16, 16:9, episode MP3) as checkboxes.
- **Generate on demand** — queue worker or browser FFmpeg.wasm jobs with clear status (same patterns as clip/session exports today).
- **Preset bundles** — quick actions: “All tracks ZIP”, “Post-production pack” (merged + transcript JSON + show notes).

### ZIP bundle download

- Server-streamed ZIP of selected S3 objects (or worker-built archive uploaded once, then signed GET).
- No YouTube API.

## Deferred (later)

| Feature                                 | Why defer                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| **YouTube OAuth / direct publish**      | OAuth scope, quota, channel linking, takedown policy — not v1                                 |
| **Embed player** (`/embed/[sessionId]`) | CDN/auth hotlinking, transcript sync, privacy on shared links — revisit after bundle UX ships |

## Studio “all main features” (Plan 13 alignment)

Distribution assumes **studio + trust path works**: invite-only join, recording, live upload progress, recovery, session review. See [Plan 13 Phase 2](13-riverside-competitive-roadmap.md) for access control (invites, expiry, lock).

## Files (target)

- `packages/trpc/src/modules/exports/` — `createExportBundle`, `getBundleStatus`, signed URLs
- `apps/worker` — optional `bundle-zip` job assembling keys
- `apps/client/components/export/export-bundle-picker.tsx`
- `apps/client/app/(site)/export/[sessionId]/page.tsx` — wire picker + ZIP CTA

## Acceptance criteria

- User selects subset of assets → receives ZIP or individual signed downloads
- Merged / layout renders respect existing session export + clip pipelines
- Export refuses when tracks incomplete; shows per-asset status
- `bun run check` passes

## Out of scope (v1)

- YouTube, Spotify, RSS publish
- Public embed without auth model
- CapCut project export
