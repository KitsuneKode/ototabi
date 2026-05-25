# Plan 24: Demo Mode (Browser MVP)

**Status:** done (Batch 5)  
**Priority:** P2 (Creator Suite Lane 3)  
**Depends on:** Plan 13 Phase 0–1 (recording trust), Plan 18 (session data layer)

## Shipped (v1)

- Routes: `/demo` (limits + flow), `/demo/record` (capture), `/demo/[sessionId]/edit` (manual editor), `/export/[sessionId]` (16:9 + 9:16 when `mode === DEMO`)
- Schema: `RecordingSession.mode` (`STUDIO` | `DEMO`), `DemoSessionData` (cursor JSON, zoom regions, trim, background)
- tRPC `demo.*` (host-only): `startSession`, `stopSession`, `getSession`, `saveEdit`
- Client: `DemoCaptureManager` (getDisplayMedia + OPFS/IDB dual-write), `DemoCursorLogger` (~30 fps), zustand `demo-editor-store`
- Nav: App shell **Product demo** → `/demo/record`

## Browser limits (documented on `/demo`)

- Chrome/Edge first; Safari system audio limited; Linux PipeWire; styled cursor overlay (no native hide on Linux)
- FFmpeg.wasm export: recommend &lt; 15 min (`DEMO_EXPORT_LIMITS`)

## Deferred

- Auto-zoom from cursor clusters, GIF export, blur, annotations, desktop app, full FFmpeg cursor draw (v1.1)

## Reference

- `.plans/19-creator-suite-vision.md` — Demo lane
- `.plans/20-creator-suite-execution.md` — Batch 5
