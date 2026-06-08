"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

import { clampPlayhead } from "./timeline-math";

export function ExportTrackPreview({
  videoUrl,
  playheadSec,
  onPlayheadChange,
  durationSec,
}: {
  videoUrl: string | null;
  playheadSec: number;
  onPlayheadChange: (sec: number) => void;
  durationSec: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubbingRef = useRef(false);
  const onPlayheadChangeEvent = useEffectEvent(onPlayheadChange);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const onTimeUpdate = () => {
      if (scrubbingRef.current) return;
      onPlayheadChangeEvent(clampPlayhead(video.currentTime, durationSec));
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoUrl, durationSec]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    const target = clampPlayhead(playheadSec, durationSec);
    if (Math.abs(video.currentTime - target) > 0.35) {
      scrubbingRef.current = true;
      video.currentTime = target;
      const id = window.setTimeout(() => {
        scrubbingRef.current = false;
      }, 400);
      return () => window.clearTimeout(id);
    }
  }, [playheadSec, durationSec, videoUrl]);

  return (
    <AnalogInset className="space-y-2 p-0">
      <div className="relative aspect-video w-full overflow-hidden rounded">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            aria-label="Export track preview"
            className="h-full w-full object-contain"
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center px-4 text-center font-mono text-xs">
            Select a completed track to preview
          </div>
        )}
      </div>
      <MonoLabel className="block px-3 pb-3 text-[9px] tabular-nums">
        Preview @ {formatTimestamp(clampPlayhead(playheadSec, durationSec))}
      </MonoLabel>
    </AnalogInset>
  );
}
