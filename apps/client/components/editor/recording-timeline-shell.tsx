"use client";

import { useMemo } from "react";

import { resolveSessionDurationSec } from "@/lib/hooks/use-export-timeline";

import { TimelineLite, type TimelineLiteMarker, type TimelineLiteTrack } from "./timeline-lite";
import { normalizeTrimRange } from "./timeline-math";

type SessionSlice = {
  startedAt: Date | string;
  endedAt?: Date | string | null;
  tracks: Array<{ id: string; type: string; user?: { name?: string | null } | null }>;
};

/** Read-only timeline shell on session review (no preview sync). */
export function RecordingTimelineShell({
  session,
  chapterMarkers,
}: {
  session: SessionSlice;
  chapterMarkers: TimelineLiteMarker[];
}) {
  const durationSec = resolveSessionDurationSec(session);

  const tracks: TimelineLiteTrack[] = useMemo(
    () =>
      (session.tracks ?? []).map((track) => ({
        id: track.id,
        label: `${track.user?.name ?? "Guest"} · ${track.type}`,
        durationSec,
      })),
    [session.tracks, durationSec],
  );

  const trimByTrackId = useMemo(() => {
    const map: Record<string, ReturnType<typeof normalizeTrimRange>> = {};
    for (const track of tracks) {
      map[track.id] = normalizeTrimRange(0, durationSec, durationSec);
    }
    return map;
  }, [tracks, durationSec]);

  if (tracks.length === 0) return null;

  return (
    <TimelineLite
      tracks={tracks}
      markers={chapterMarkers}
      durationSec={durationSec}
      playheadSec={0}
      activeTrackId={null}
      trimByTrackId={trimByTrackId}
      onPlayheadChange={() => {}}
      onActiveTrackChange={() => {}}
      onTrimChange={() => {}}
      disabled
    />
  );
}
