# Plan 02: Local Recording Recovery (OPFS + Dual Storage)

**Status:** pending  
**Priority:** P0

## Problem

Recording chunks are stored only in IndexedDB. Chrome can evict IndexedDB data under memory pressure, causing permanent data loss. This is the #1 trust issue for a recording platform.

## Solution

Dual-write every chunk to both OPFS (Origin Private File System) and IndexedDB. OPFS is persistent and not evictable. On upload, read from OPFS first, fall back to IndexedDB. Recovery console scans both sources.

## Implementation

- `apps/client/lib/localDB/opfs-storage.ts` — write/read/delete chunk blobs via File System Access API
- `apps/client/lib/recorder/recorder-manager.ts` — after `ondataavailable`, write to both OPFS and IndexedDB
- `apps/client/app/recovery/page.tsx` — scan OPFS in addition to IndexedDB

## Files to Create

- `apps/client/lib/localDB/opfs-storage.ts`

## Files to Change

- `apps/client/lib/recorder/recorder-manager.ts`
- `apps/client/app/recovery/page.tsx`

## Acceptance Criteria

- Chunk written to IndexedDB AND OPFS simultaneously
- Upload reads from OPFS first
- If OPFS read fails, falls back to IndexedDB
- Recovery console discovers orphaned chunks in both storage systems
- Purge both on successful upload completion
