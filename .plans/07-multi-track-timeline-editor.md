# Plan 07: Multi-Track Timeline Editor

**Status:** pending  
**Priority:** P2

## Problem

The current export page is functional but minimal: checkboxes, buttons, number inputs. Content creators expect a visual timeline where they can see tracks, scrub through the video, and make precise edits.

## Solution

A Canvas-based or DOM-based timeline editor:

- One lane per participant
- Video track + audio track per participant
- Waveform overlay on audio tracks (Web Audio API `decodeAudioData` + Canvas)
- Drag handles to trim start/end per track
- Multi-cam switch: click a lane at a timestamp to set the "main view"
- Playback scrub with synchronized preview
- Undo/redo stack

## Implementation

- Render timeline lanes using `<div>` elements with absolute positioning
- Waveform: fetch audio from S3 → `AudioContext.decodeAudioData()` → draw peaks on `<canvas>` per lane
- Scrub: thumb drag updates preview time, syncs video playback
- Trims: drag handles on left/right edge → update `startTime`/`endTime` for export

## Files to Create

- `apps/client/components/editor/Timeline.tsx`
- `apps/client/components/editor/TrackLane.tsx`
- `apps/client/components/editor/WaveformCanvas.tsx`
- `apps/client/components/editor/PlaybackScrub.tsx`

## Files to Change

- `apps/client/app/export/[sessionId]/page.tsx` — embed timeline

## Acceptance Criteria

- Timeline shows all participant tracks visually
- Waveform renders within 3s of loading audio
- Drag handles adjust trim points, reflected in export
- Multi-cam switch persists to export
- Undo/redo with Ctrl+Z / Ctrl+Shift+Z
