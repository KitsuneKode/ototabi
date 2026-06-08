"use client";

import { RoomAudioRenderer } from "@livekit/components-react";

import { StudioVideoGrid } from "@/components/studio/studio-video-grid";

export function StudioMainStage() {
  return (
    <main className="bg-popover relative flex min-w-0 flex-1 flex-col overflow-hidden will-change-transform">
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20 will-change-transform"
        style={{
          background: "linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      <div className="text-muted-foreground border-border bg-background/80 absolute top-3 left-3 z-20 rounded border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase">
        CH 1 : Studio Feed
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center p-3 md:p-4">
        <StudioVideoGrid />
      </div>
      <RoomAudioRenderer />
    </main>
  );
}
