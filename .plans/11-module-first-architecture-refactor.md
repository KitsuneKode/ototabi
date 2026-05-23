# Plan 11: Module-First Architecture Refactor

**Status:** pending  
**Priority:** P1

## Problem

Current tRPC routers (`rooms.ts`, `uploads.ts`) contain procedures that mix validation, business logic, database access, and auth checks. Growing these routers will create maintenance debt.

## Solution

Split each router into: `.router.ts` (thin), `.service.ts` (framework-agnostic business logic), `.repository.ts` (Prisma queries), `.policy.ts` (permission decisions). Services accept plain objects, never framework types.

## Target Structure

```
packages/trpc/src/modules/
  rooms/
    rooms.router.ts        # Procedure binding only (~20 lines)
    rooms.service.ts       # createRoom, joinRoom, startRecording, etc.
    rooms.repository.ts    # Prisma: findRoom, listRooms, createRoom
    rooms.policy.ts        # canAccessRoom, canDeleteRoom, isRoomHost
  uploads/
    uploads.router.ts
    uploads.service.ts     # S3 orchestration: startUpload, getSignedUrl, complete
    uploads.repository.ts  # Prisma: createTrack, updateTrackStatus
  chat/
    chat.router.ts
    chat.service.ts        # sendMessage, getMessages, dedupeMessages
    chat.repository.ts     # Prisma: findMessages, createMessage
  recordings/
    recordings.router.ts   # Extract session logic from rooms router
    recordings.service.ts
    recordings.repository.ts
    recordings.policy.ts   # canViewSession, canStartRecording
```

## Rules

1. Router files: MAX 30 lines. Only binds procedure names to service calls.
2. Service files: No Express/Next.js import. Accepts plain `{ actorId, roomId, data }` objects.
3. Repository files: Only Prisma queries. No business rules, no auth decisions.
4. Policy files: Pure functions returning boolean. No DB access (accept pre-fetched entity).
5. Do NOT refactor `auth`, `user` routers yet — they're small and stable.

## Files to Change

- `packages/trpc/src/routers/rooms.ts` → split into module
- `packages/trpc/src/routers/uploads.ts` → split into module
- `packages/trpc/src/routers/chat.ts` → split into module
- `packages/trpc/src/routers/_app.ts` — update imports

## Acceptance Criteria

- Each router file under 30 lines
- Services are free of `TRPCError`, Express types, request/response objects
- All existing procedures work identically after refactor
- `bun typecheck` + `bun run build` pass
- New procedures follow the same pattern
