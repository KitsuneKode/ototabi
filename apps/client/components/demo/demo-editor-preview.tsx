"use client";

import { useEffect, useRef } from "react";

import type { CursorEvent, DemoBackground, ZoomRegion } from "@/lib/demo/demo-types";

import { DemoCursorOverlay } from "@/components/demo/demo-cursor-overlay";
import { AnalogInset } from "@/components/ui/analog-card";
import { backgroundToStyle } from "@/lib/demo/demo-background-presets";

export function DemoEditorPreview({
  videoUrl,
  cursorEvents,
  zoomRegions,
  previewTimeMs,
  background,
  onTimeUpdate,
}: {
  videoUrl: string | null;
  cursorEvents: CursorEvent[];
  zoomRegions: ZoomRegion[];
  previewTimeMs: number;
  background: DemoBackground;
  onTimeUpdate: (ms: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onUpdate = () => onTimeUpdate(Math.round(video.currentTime * 1000));
    video.addEventListener("timeupdate", onUpdate);
    return () => video.removeEventListener("timeupdate", onUpdate);
  }, [onTimeUpdate, videoUrl]);

  return (
    <AnalogInset
      className="relative aspect-video w-full overflow-hidden p-0"
      style={backgroundToStyle(background)}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="h-full w-full object-contain"
          playsInline
        />
      ) : (
        <div className="text-muted-foreground flex h-full min-h-[240px] items-center justify-center font-mono text-xs">
          Upload a screen track to preview
        </div>
      )}
      <DemoCursorOverlay
        events={cursorEvents}
        zoomRegions={zoomRegions}
        previewTimeMs={previewTimeMs}
        frameWidth={1920}
        frameHeight={1080}
      />
    </AnalogInset>
  );
}
