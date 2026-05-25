# Plan 05: Text-Based Editing

**Status:** in-progress — `TranscriptEditor` on recordings/export; full FFmpeg cut export TBD  
**Priority:** P1

## Problem

Video editing is intimidating for non-technical creators. They need to remove sections but don't want to learn timeline editors or deal with precise frame selection.

## Solution

Display the transcript on the export page. User selects a sentence or paragraph they want to remove. System computes the timestamps, cuts that segment from the source tracks, and re-concatenates the remaining pieces using FFmpeg.wasm. One-click download of the edited video.

This is the marquee demo feature — Descript charges $15/mo for this.

## Implementation

1. Load transcript segments for the session
2. Render transcript as selectable text blocks with timestamps
3. User selects text range → system marks as "cut"
4. On apply: FFmpeg.wasm trims each track to remove marked segments
5. Download edited video

## Files to Change

- `apps/client/app/export/[sessionId]/page.tsx` — add transcript view + cut mode
- New component: `TranscriptEditor` (renders segments, handles selection)

## Acceptance Criteria

- Transcript displayed alongside export tools
- Click to select a sentence or paragraph
- "Remove selection" button cuts that time range from all tracks
- "Preview cut" shows before/after without downloading
- Apply all cuts → download edited video
