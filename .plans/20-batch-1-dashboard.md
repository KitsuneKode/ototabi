# Batch 1 — Dashboard & Host Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`. Checkbox steps below.

**Goal:** Fix dashboard UX bugs, reduce host tRPC overhead, optional single `dashboard.getSummary` round-trip.

**Architecture:** Client fixes in extracted dashboard components; server role cached in tRPC context; slim `listSharedRooms` Prisma select.

**Tech stack:** React 19, TanStack Query, tRPC 11, Prisma, Zustand (recovery badge only).

**Depends on:** None (can run before Batch 0 in parallel only if no schema changes — prefer after Batch 0 if touching upload status).

---

## Files map

| Action            | Path                                                            |
| ----------------- | --------------------------------------------------------------- |
| Modify            | `apps/client/app/dashboard/page.tsx`                            |
| Create            | `apps/client/components/dashboard/dashboard-room-list.tsx`      |
| Create            | `apps/client/components/dashboard/dashboard-sessions-panel.tsx` |
| Modify            | `packages/trpc/src/trpc.ts`                                     |
| Modify            | `packages/trpc/src/modules/rooms/rooms.repository.ts`           |
| Create (optional) | `packages/trpc/src/modules/dashboard/*`                         |
| Modify            | `packages/trpc/src/routers/_app.ts`                             |
| Modify            | `apps/client/app/recovery/page.tsx`                             |
| Modify            | `apps/client/components/layout/app-shell.tsx`                   |
| Create or fix     | `apps/client/app/recordings/page.tsx` OR remove dead nav link   |

---

### Task 1: Extract dashboard room list

**Files:**

- Create: `apps/client/components/dashboard/dashboard-room-list.tsx`
- Modify: `apps/client/app/dashboard/page.tsx`

- [ ] **Step 1:** Move room list JSX + `handleCopyLink` + tabs (Owned/Shared) into `DashboardRoomList` at module scope (no inline components in `page.tsx`).

- [ ] **Step 2:** Props: `rooms`, `sharedRooms`, `selectedRoomId`, `onSelectRoom`, `searchQuery`, `onSearchChange`, `onCopyInvite`, `onOpenStudio`.

- [ ] **Step 3:** Fix empty state — render empty when `rooms.length + sharedRooms.length === 0`.

- [ ] **Step 4:** Fix count badge — `rooms.length + sharedRooms.length`.

- [ ] **Step 5:** Run `bun typecheck` — expect pass.

- [ ] **Step 6:** Commit: `refactor(client): extract dashboard room list component`

---

### Task 2: Auto-select room + studio CTA

**Files:**

- Modify: `apps/client/app/dashboard/page.tsx`
- Modify: `apps/client/components/dashboard/dashboard-room-list.tsx`

- [ ] **Step 1:** `useEffect`: when `allRooms.length === 1` and `!selectedRoomId`, set `selectedRoomId` to that room's id.

- [ ] **Step 2:** When `allRooms.length > 1` and none selected, optionally select most recently updated (if `updatedAt` on list DTO).

- [ ] **Step 3:** Add primary **Open studio** button per row → `/chat/{roomId}` (or existing join route pattern).

- [ ] **Step 4:** Copy invite URL includes lobby `invite` query param (match create-room success handler).

- [ ] **Step 5:** Manual test: shared-only account sees list + sessions, not "create first room".

- [ ] **Step 6:** Commit: `fix(client): dashboard auto-select and studio CTAs`

---

### Task 3: Cache host role in tRPC context

**Files:**

- Modify: `packages/trpc/src/trpc.ts`
- Modify: `packages/trpc/src/context.ts` (or wherever `createContext` lives)

- [ ] **Step 1:** In `createContext`, after session resolved, single `prisma.user.findUnique({ where: { id }, select: { role: true } })` → attach `ctx.userRole`.

- [ ] **Step 2:** Change `hostProcedure` to check `ctx.userRole === 'host'` (or project enum) — remove per-request duplicate lookup.

- [ ] **Step 3:** Run `bun typecheck`.

- [ ] **Step 4:** Commit: `perf(trpc): cache user role in request context`

---

### Task 4: Slim listSharedRooms

**Files:**

- Modify: `packages/trpc/src/modules/rooms/rooms.repository.ts`

- [ ] **Step 1:** Align `listRoomsByMember` `select` with owned list: id, name, code, updatedAt, `_count: { sessions, members }` — drop nested `members.user`.

- [ ] **Step 2:** Verify dashboard still renders shared rooms.

- [ ] **Step 3:** Commit: `perf(rooms): slim shared room list query`

---

### Task 5 (optional): dashboard.getSummary

**Files:**

- Create: `packages/trpc/src/modules/dashboard/dashboard.dto.ts`
- Create: `packages/trpc/src/modules/dashboard/dashboard.repository.ts`
- Create: `packages/trpc/src/modules/dashboard/dashboard.service.ts`
- Create: `packages/trpc/src/modules/dashboard/dashboard.router.ts`
- Modify: `packages/trpc/src/routers/_app.ts`
- Create: `apps/client/lib/hooks/use-dashboard-summary.ts`
- Modify: `apps/client/app/dashboard/page.tsx`

- [ ] **Step 1:** One `hostProcedure` returning `{ ownedRooms, sharedRooms, recentSessions }` with slim DTOs (parallel Prisma in repository).

- [ ] **Step 2:** Replace three parallel queries on dashboard with `useDashboardSummary`.

- [ ] **Step 3:** Keep `getRecordingSessions` enabled only when `selectedRoomId` set.

- [ ] **Step 4:** `bun fmt && bun lint && bun typecheck && bun run test`.

- [ ] **Step 5:** Commit: `feat(trpc): dashboard.getSummary bundle`

---

### Task 6: Recovery badge + recordings nav

**Files:**

- Modify: `apps/client/app/recovery/page.tsx`
- Modify: `apps/client/components/layout/app-shell.tsx`

- [ ] **Step 1:** Recovery page — batch chunk count query (one IndexedDB pass, not per-session map).

- [ ] **Step 2:** Hook `usePendingUploadCount()` reading IndexedDB metadata (or zustand store updated on recovery scan).

- [ ] **Step 3:** AppShell Recovery nav shows amber badge when count > 0.

- [ ] **Step 4:** Add `apps/client/app/recordings/page.tsx` listing `listRecentSessions` OR remove unused `/recordings` quick link.

- [ ] **Step 5:** Commit: `feat(client): recovery pending badge and recordings index`

---

## Batch 1 verification (required)

```bash
bun fmt && bun lint && bun typecheck && bun run test
```

Manual: host login → dashboard with 1 room auto-selected → copy invite → open studio → recovery badge when pending chunks exist.

**Do not claim Batch 1 complete without command output.**

---

## Handoff

After verification: `superpowers:requesting-code-review` against Plan 19 dashboard row → proceed to [Batch 2 deploy](20-batch-2-deploy.md) or [Batch 0 trust](20-batch-0-trust.md) if trust work prioritized first per README order.
