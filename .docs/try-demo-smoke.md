# Demo browser v1.1 — smoke checklist

Prereqs: local stack running (`bun run dev`), signed-in host, Chrome or Edge.

## 1. Capture with optional webcam PiP

1. Open `/demo/record`.
2. Enable **Webcam PiP track** and **microphone**, start capture.
3. Share a window for ~30s, move the cursor with a few clicks, stop.
4. Confirm redirect to `/demo/{sessionId}/edit` and session shows a `CAMERA` track when PiP was enabled.

## 2. Editor — auto-zoom preview

1. On the edit page, click **Suggest zoom from cursor** (requires enough pointer events).
2. Scrub the preview video — the frame should punch in on active zoom regions with cursor overlay.
3. Adjust trim start/end (ms) and playback speed, pick a blur preset, toggle PiP if webcam exists.
4. **Save edits** — reload page; values should persist.

## 3. Export — demo pipeline

1. Open `/export/{sessionId}` for the same demo session.
2. Select display (+ webcam/mic if present).
3. Export **16:9** and **9:16** — job should complete without FFmpeg filter errors.
4. Output should respect trim/speed; webcam appears bottom-right when PiP enabled.

## 4. Regression

- Studio `/chat/*` unchanged.
- Non-demo export merge/trim still works on studio sessions.
