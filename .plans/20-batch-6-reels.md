# Batch 6 — Reels Presets (native JSON packs)

**Status:** pending  
**Priority:** P2  
**Depends on:** Batch 3 clips + worker 9:16 export stable on staging

## Goal

Apply native JSON preset packs (caption style, safe zones, motion) to clip renders without CapCut import.

## Scope

1. **Preset schema** — `packages/common` or `apps/worker` JSON under `presets/reels/*.json`
2. **Worker** — extend `export-render` or new `reels-render` job: `clipId` + `presetId` → MP4
3. **UI** — preset picker on `/recordings/[sessionId]` and `/export/[sessionId]` when `renderStatus === ready`

## Acceptance

- At least 2 presets ship (e.g. `bold-captions`, `minimal-lower-third`)
- Queue preset render from session review; poll until ready; download
- `bun run check` passes

## Out of scope

- Lyrics sync, CapCut project import, timeline keyframes beyond zoom/caption templates
