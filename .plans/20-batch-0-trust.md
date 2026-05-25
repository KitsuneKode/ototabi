# Batch 0 — Recording Trust (Plan 13 Phase 0–1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans`. TDD where policies/upload logic allow (`superpowers:test-driven-development`).

**Goal:** Riverside-class trust — OPFS dual-write, upload ownership, recovery, private media, sync markers on export.

**Architecture:** Module-first in `packages/trpc/src/modules/uploads`, `rooms`, client `recorder-manager` + `opfs-storage`.

**Tech stack:** Prisma, OPFS, IndexedDB, S3 signed URLs, LiveKit auth route.

**Parent:** [Plan 13](13-riverside-competitive-roadmap.md) Phase 0–1. **Gates:** Demo mode (Plan 20-batch-5) and reels.

---

## Acceptance (Batch 0 complete when)

- [ ] Final MediaRecorder chunk awaited before upload complete
- [ ] Chunks dual-written OPFS + IndexedDB; upload reads OPFS first
- [ ] Recovery console finds orphans in both stores
- [ ] Guest cannot complete another user's upload
- [ ] LiveKit token denied without room access
- [ ] Session review shows sync markers; export applies offset
- [ ] E2E smoke documented in `.docs/quick-start.md`

---

## Task outline (decompose during execute — follow Plan 13 file list)

Reference implementation files from [Plan 13](13-riverside-competitive-roadmap.md):

- `packages/store/prisma/schema.prisma` — `UploadSession`, `RecordingEvent` if missing
- `packages/trpc/src/modules/uploads/*`
- `apps/client/lib/localDB/opfs-storage.ts` (create)
- `apps/client/lib/recorder/recorder-manager.ts`
- `apps/client/app/recovery/page.tsx`
- `apps/api/src/routes/live-kit-auth.ts`

Each sub-task in execution session must follow writing-plans checkbox format with:

1. Failing test or smoke step
2. Minimal implementation
3. `bun run test` + typecheck
4. Scoped commit

**Do not start Batch 5 (demo) until this batch acceptance is checked.**

---

## Verification gate

```bash
bun fmt && bun lint && bun typecheck && bun run test
```

Plus manual smoke: host → record → kill tab → recovery → retry upload.
