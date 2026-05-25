"use client";

import { GridLayout, ParticipantTile, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

export function StudioVideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout
      tracks={tracks}
      className="h-full w-full"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ParticipantTile className="border-border/60 bg-card overflow-hidden rounded border-2 shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
    </GridLayout>
  );
}
