import type { CursorEvent, ZoomRegion } from "@/lib/demo/demo-types";

/** Viewport size captured with cursor events (client pixels). */
export const DEMO_CAPTURE_VIEWPORT = { width: 1920, height: 1080 } as const;

export function findCursorAtTime(events: CursorEvent[], timeMs: number): CursorEvent | null {
  if (events.length === 0) return null;
  let last: CursorEvent | null = null;
  for (const event of events) {
    if (event.t > timeMs) break;
    last = event;
  }
  return last;
}

export function activeZoomScale(
  zoomRegions: { startMs: number; endMs: number; scale: number }[],
  timeMs: number,
): number {
  const active = zoomRegions.find((z) => timeMs >= z.startMs && timeMs <= z.endMs);
  return active?.scale ?? 1;
}

/** CSS transform-origin for zoom-at-cursor preview (percent). */
function zoomOriginFromCursor(
  cursor: CursorEvent | null,
  viewport = DEMO_CAPTURE_VIEWPORT,
): string {
  if (!cursor) return "50% 50%";
  const xPct = (cursor.x / viewport.width) * 100;
  const yPct = (cursor.y / viewport.height) * 100;
  return `${xPct}% ${yPct}%`;
}

export function demoPreviewZoomStyle(
  zoomRegions: ZoomRegion[],
  cursorEvents: CursorEvent[],
  previewTimeMs: number,
): { transform: string; transformOrigin: string } {
  const scale = activeZoomScale(zoomRegions, previewTimeMs);
  const cursor = findCursorAtTime(cursorEvents, previewTimeMs);
  return {
    transform: scale === 1 ? "none" : `scale(${scale})`,
    transformOrigin: zoomOriginFromCursor(cursor),
  };
}
