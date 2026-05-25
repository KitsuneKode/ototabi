# Plan 01: Guest Join Without Authentication

**Status:** done (guest cookies, invite link, host lockout, studio guest label, lobby invite)  
**Priority:** P0

## Problem

Currently all users must sign up with email/password before joining any room. This is the #1 friction for podcast guests. Riverside's core value prop is "one click, no install, no signup."

## Solution

Guest join flow: room link → name entry → device pre-flight check → enter studio.

**Auth Model:** Generate a temp guest token scoped to the specific room. No Better Auth session needed. The token grants access to the joinRoom + LiveKit token endpoints for that room only.

**Pre-flight check:** Microphone level meter (AnalyserNode), camera preview, speaker test (play tone), bandwidth estimate (timed blob fetch). All on one page before entering the studio.

## Files to Change

- `apps/client/app/rooms/[roomId]/join/page.tsx` — add pre-flight UI
- `packages/auth/src/index.ts` — guest token generation endpoint
- `packages/trpc/src/routers/auth.ts` — `createGuestToken` procedure
- Database: either `User.role = 'guest'` field or `GuestParticipant` model

## Acceptance Criteria

- Guest clicks join link → enters name → sees mic/cam/speaker check → enters studio
- Guest recording uploads to S3 under session scope
- Guest appears as "Guest: [name]" in sidebar
- Guest cannot access dashboard or other rooms
