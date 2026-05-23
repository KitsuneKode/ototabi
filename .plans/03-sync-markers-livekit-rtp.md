# Plan 03: Sync Markers via LiveKit RTP Timestamps

**Status:** pending  
**Priority:** P1

## Problem

Each participant's local recording uses their own system clock. When combining tracks in post-production, they drift. Without sync, multi-track recording has no value.

## Solution

Every 2s during recording, each client broadcasts a sync marker via LiveKit data channel:

```json
{ "localTime": 12345.67, "rtpTimestamp": 9876543210 }
```

The host (or server) collects these markers and stores them in a `SyncMarker` table. During export, load all markers for a session, interpolate per-track offsets relative to a reference track, and slice/align tracks via FFmpeg.

This avoids waveform cross-correlation (slow, error-prone) and provides sub-frame accuracy.

## Database

```prisma
model SyncMarker {
  id         String   @id @default(cuid())
  sessionId  String
  userId     String
  localTime  Float
  serverTime DateTime @default(now())
  trackSid   String?
  @@index([sessionId, userId])
}
```

## Files to Create

- Migration: `sync_marker` table

## Files to Change

- `apps/client/app/chat/[roomId]/page.tsx` — broadcast markers every 2s
- `packages/trpc/src/routers/` — `submitSyncMarker`, `getSyncMarkers` procedures
- `apps/client/app/export/[sessionId]/page.tsx` — alignment logic

## Acceptance Criteria

- Markers broadcast every 2s during recording
- Stored in database with session + user refs
- Export page aligns tracks to reference track with <50ms error
