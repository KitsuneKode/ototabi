"use client";

import { useCallback, useRef } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

import {
  clampTrimHandle,
  normalizeTrimRange,
  percentToSec,
  secToPercent,
  type TrimRangeSec,
} from "./timeline-math";

export type TrackLaneModel = {
  id: string;
  label: string;
  durationSec: number;
};

export function TrackLane({
  track,
  timelineDurationSec,
  playheadSec,
  trim,
  isActive,
  onSelect,
  onTrimChange,
  onSeek,
}: {
  track: TrackLaneModel;
  timelineDurationSec: number;
  playheadSec: number;
  trim: TrimRangeSec | null;
  isActive: boolean;
  onSelect: () => void;
  onTrimChange: (range: TrimRangeSec) => void;
  onSeek: (sec: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const duration = Math.max(timelineDurationSec, track.durationSec, 1);
  const widthPct = Math.min(100, (track.durationSec / duration) * 100);

  const trimRange =
    trim ?? normalizeTrimRange(0, track.durationSec > 0 ? track.durationSec : duration, duration);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      onSeek(percentToSec(pct, duration));
    },
    [duration, onSeek],
  );

  const updateTrimFromPointer = (e: React.PointerEvent<HTMLButtonElement>, edge: "in" | "out") => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const sec = percentToSec(pct, duration);
    const next =
      edge === "in"
        ? clampTrimHandle(sec, trimRange.trimOutSec, duration, "in")
        : clampTrimHandle(sec, trimRange.trimInSec, duration, "out");
    const normalized = normalizeTrimRange(
      edge === "in" ? next : trimRange.trimInSec,
      edge === "out" ? next : trimRange.trimOutSec,
      duration,
    );
    onTrimChange(normalized);
  };

  const trimInPct = secToPercent(trimRange.trimInSec, duration);
  const trimOutPct = secToPercent(trimRange.trimOutSec, duration);
  const playheadPct = secToPercent(playheadSec, duration);
  const clampedPlayhead = Math.min(Math.max(playheadSec, 0), duration);

  return (
    <AnalogInset
      className={`p-3 transition-colors ${isActive ? "ring-accent/60 ring-1" : ""}`}
      onClick={onSelect}
    >
      <div className="mb-2 flex items-center justify-between">
        <MonoLabel>{track.label}</MonoLabel>
        <MonoLabel className="text-[9px] tabular-nums">
          {formatTimestamp(trimRange.trimInSec)} – {formatTimestamp(trimRange.trimOutSec)}
        </MonoLabel>
      </div>
      <div
        ref={railRef}
        role="slider"
        aria-label={`${track.label} timeline position`}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={clampedPlayhead}
        className="bg-popover relative h-10 cursor-pointer overflow-hidden rounded border"
        onClick={(e) => {
          e.stopPropagation();
          seekFromClientX(e.clientX);
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 5 : 1;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            e.stopPropagation();
            onSeek(Math.max(0, clampedPlayhead - step));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            e.stopPropagation();
            onSeek(Math.min(duration, clampedPlayhead + step));
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }
        }}
        tabIndex={0}
      >
        <div
          className="bg-muted/40 absolute top-0 left-0 h-full rounded-sm"
          style={{ width: `${widthPct}%` }}
        />
        <div
          className="bg-accent/50 border-accent/80 absolute top-0 h-full border-x"
          style={{ left: `${trimInPct}%`, width: `${Math.max(0, trimOutPct - trimInPct)}%` }}
        />
        <div
          className="bg-foreground/80 absolute top-0 h-full w-0.5"
          style={{ left: `${playheadPct}%` }}
        />
        {isActive ? (
          <>
            <button
              type="button"
              aria-label="Trim in"
              className="bg-accent border-background absolute top-0 z-10 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-sm border"
              style={{ left: `${trimInPct}%` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                e.stopPropagation();
                updateTrimFromPointer(e, "in");
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              aria-label="Trim out"
              className="bg-accent border-background absolute top-0 z-10 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-sm border"
              style={{ left: `${trimOutPct}%` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                e.stopPropagation();
                updateTrimFromPointer(e, "out");
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </>
        ) : null}
      </div>
    </AnalogInset>
  );
}
