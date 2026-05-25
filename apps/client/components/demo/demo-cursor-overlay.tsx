"use client";

import type { CursorEvent } from "@/lib/demo/demo-types";

function findCursorAtTime(events: CursorEvent[], timeMs: number): CursorEvent | null {
  if (events.length === 0) return null;
  let last: CursorEvent | null = null;
  for (const event of events) {
    if (event.t > timeMs) break;
    last = event;
  }
  return last;
}

function scaleForTime(
  zoomRegions: { startMs: number; endMs: number; scale: number }[],
  timeMs: number,
): number {
  const active = zoomRegions.find((z) => timeMs >= z.startMs && timeMs <= z.endMs);
  return active?.scale ?? 1;
}

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
  const zoom = scaleForTime(zoomRegions, previewTimeMs);
  if (!cursor) return null;

  const xPct = (cursor.x / window.innerWidth) * 100;
  const yPct = (cursor.y / window.innerHeight) * 100;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: `${xPct}% ${yPct}%`,
      }}
      aria-hidden
    >
      <div
        className="border-accent bg-accent/30 absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
        style={{
          left: `${(cursor.x / window.innerWidth) * 100}%`,
          top: `${(cursor.y / window.innerHeight) * 100}%`,
          width: frameWidth > 0 ? `${(16 / frameWidth) * 100}%` : "12px",
          height: frameHeight > 0 ? `${(16 / frameHeight) * 100}%` : "12px",
        }}
      />
      {cursor.type === "down" ? (
        <div
          className="border-accent/60 absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            left: `${(cursor.x / window.innerWidth) * 100}%`,
            top: `${(cursor.y / window.innerHeight) * 100}%`,
            width: "2.5rem",
            height: "2.5rem",
            animation: "pulse 0.4s ease-out",
          }}
        />
      ) : null}
    </div>
  );
}
