"use client";

import { useCallback, useRef } from "react";

import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

import { clampPlayhead, percentToSec, secToPercent } from "./timeline-math";

export function PlaybackScrub({
  durationSec,
  playheadSec,
  onPlayheadChange,
  disabled,
}: {
  durationSec: number;
  playheadSec: number;
  onPlayheadChange: (sec: number) => void;
  disabled?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      if (!rail || durationSec <= 0 || disabled) return;
      const rect = rail.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      onPlayheadChange(percentToSec(pct, durationSec));
    },
    [durationSec, disabled, onPlayheadChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || disabled) return;
    seekFromClientX(e.clientX);
  };

  const playhead = clampPlayhead(playheadSec, durationSec);
  const playheadPct = secToPercent(playhead, durationSec);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <MonoLabel className="text-[9px]">Scrub</MonoLabel>
        <MonoLabel className="text-[9px] tabular-nums">
          {formatTimestamp(playhead)} / {formatTimestamp(durationSec)}
        </MonoLabel>
      </div>
      <div
        ref={railRef}
        role="slider"
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={durationSec}
        aria-valuenow={playhead}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          const step = e.shiftKey ? 5 : 1;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            onPlayheadChange(clampPlayhead(playhead - step, durationSec));
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            onPlayheadChange(clampPlayhead(playhead + step, durationSec));
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className={`bg-popover relative h-6 cursor-pointer overflow-hidden rounded border ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <div
          className="bg-accent/25 absolute top-0 left-0 h-full"
          style={{ width: `${playheadPct}%` }}
        />
        <div
          className="bg-foreground absolute top-0 h-full w-1 -translate-x-1/2 rounded-full"
          style={{ left: `${playheadPct}%` }}
        />
      </div>
    </div>
  );
}
