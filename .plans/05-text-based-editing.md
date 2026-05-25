# Plan 05: Text-Based Editing

**Status:** in-progress — cut export **shipped** in browser; preview polish + Pro UI gate TBD  
**Priority:** P1

## Problem

Video editing is intimidating for non-technical creators. They need to remove sections but don't want to learn timeline editors or deal with precise frame selection.

## Solution

Display the transcript on the export page. User selects a sentence or paragraph they want to remove. System computes the timestamps, cuts that segment from the source tracks, and re-concatenates the remaining pieces using FFmpeg.wasm. One-click download of the edited video.

This is the marquee demo feature — Descript charges $15/mo for this.

## Implementation (current)

1. `TranscriptEditor` + `export-console-store` cut mode on export page — **done**
2. `handleCuts` in `export/[sessionId]/page.tsx` — keep-ranges + FFmpeg concat per track — **done**
3. Preview cut range in store — partial
4. Pro plan UI disable (Plan 08) — **TBD**
5. Smoke: select segments → remove → download — add to try-local-smoke

## Files to Change

- `apps/client/app/export/[sessionId]/page.tsx` — add transcript view + cut mode
- New component: `TranscriptEditor` (renders segments, handles selection)

## Acceptance Criteria

- Transcript displayed alongside export tools
- Click to select a sentence or paragraph
- "Remove selection" button cuts that time range from all tracks
- "Preview cut" shows before/after without downloading
- Apply all cuts → download edited video
