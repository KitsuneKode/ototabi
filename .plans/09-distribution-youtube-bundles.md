# Plan 09: Distribution — YouTube, ZIP Bundles, Embed Player

**Status:** pending  
**Priority:** P2

## Problem

After exporting, users need to get their content to platforms. Currently they download a file and manually upload. Friction costs time.

## Solution

### YouTube Direct Publish

OAuth flow to connect YouTube channel → resumable upload via YouTube Data API v3. Single click from export page.

### ZIP Bundle Download

Download all separate tracks + merged master as a single ZIP. Server streams ZIP of all S3 objects for the session.

### Embed Player

An `<iframe>` embed with retro-styled player. Shows the merged video with transcript overlay. Hosted on the platform. Share link for social embeds.

## Files to Create

- `apps/client/app/api/youtube/` — OAuth callback route
- `apps/client/components/EmbedPlayer.tsx`
- New page: `apps/client/app/embed/[sessionId]/page.tsx`

## Files to Change

- `apps/client/app/export/[sessionId]/page.tsx` — YouTube publish button, ZIP download
- `packages/trpc/src/routers/` — `publishToYouTube`, `getSessionZip` procedures

## Acceptance Criteria

- YouTube OAuth flow completes and channel is linked
- One-click publish uploads video with title + description from show notes
- ZIP download includes all tracks + merged master
- Embed player displays video with transcript
