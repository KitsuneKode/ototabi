"use client";

import type { CursorEvent } from "@/lib/demo/demo-types";

import {
  activeZoomScale,
  DEMO_CAPTURE_VIEWPORT,
  findCursorAtTime,
} from "@/lib/demo/demo-zoom-preview";

export function DemoCursorOverlay({
  events,
  zoomRegions,
  previewTimeMs,
  frameWidth,
  frameHeight,
}: {
  events: CursorEvent[];
  zoomRegions: { startMs: number; endMs: number; scale: number }[];
  previewTimeMs: number;
  frameWidth: number;
  frameHeight: number;
}) {
  const cursor = findCursorAtTime(events, previewTimeMs);
  const zoom = activeZoomScale(zoomRegions, previewTimeMs);
  if (!cursor) return null;

  const viewport =
    typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : DEMO_CAPTURE_VIEWPORT;

  const xPct = (cursor.x / viewport.width) * 100;
  const yPct = (cursor.y / viewport.height) * 100;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="border-accent bg-accent/30 absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: frameWidth > 0 ? `${(16 / frameWidth) * 100}%` : "12px",
          height: frameHeight > 0 ? `${(16 / frameHeight) * 100}%` : "12px",
          opacity: zoom > 1 ? 0.9 : 1,
        }}
      />
      {cursor.type === "down" ? (
        <div
          className="border-accent/60 absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: `${xPct}%`,
            top: `${yPct}%`,
            width: "2.5rem",
            height: "2.5rem",
            animation: "pulse 0.4s ease-out",
          }}
        />
      ) : null}
    </div>
  );
}
