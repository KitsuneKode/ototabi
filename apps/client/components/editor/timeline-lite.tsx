"use client";

import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

import { PlaybackScrub } from "./PlaybackScrub";
import { normalizeTrimRange, type TrimRangeSec } from "./timeline-math";
import { TrackLane, type TrackLaneModel } from "./TrackLane";

export type TimelineLiteTrack = TrackLaneModel;

export type TimelineLiteMarker = {
  id: string;
  label: string;
  atSec: number;
};

export function TimelineLite({
  tracks,
  markers,
  durationSec,
  playheadSec,
  activeTrackId,
  trimByTrackId,
  onPlayheadChange,
  onActiveTrackChange,
  onTrimChange,
  disabled,
}: {
  tracks: TimelineLiteTrack[];
  markers?: TimelineLiteMarker[];
  durationSec: number;
  playheadSec: number;
  activeTrackId: string | null;
  trimByTrackId: Record<string, TrimRangeSec>;
  onPlayheadChange: (sec: number) => void;
  onActiveTrackChange: (trackId: string) => void;
  onTrimChange: (trackId: string, range: TrimRangeSec) => void;
  disabled?: boolean;
}) {
  const timelineDuration = Math.max(durationSec, ...tracks.map((t) => t.durationSec), 1);

  return (
    <AnalogCard className="space-y-4 p-4 md:p-6">
      <PanelTitle label="Timeline lite" title="Multi-track rail" />

      <PlaybackScrub
        durationSec={timelineDuration}
        playheadSec={playheadSec}
        onPlayheadChange={onPlayheadChange}
        disabled={disabled}
      />

      <div className="space-y-3">
        {tracks.map((track) => {
          const trim =
            trimByTrackId[track.id] ?? normalizeTrimRange(0, track.durationSec, timelineDuration);
          return (
            <TrackLane
              key={track.id}
              track={track}
              timelineDurationSec={timelineDuration}
              playheadSec={playheadSec}
              trim={trim}
              isActive={activeTrackId === track.id}
              onSelect={() => onActiveTrackChange(track.id)}
              onTrimChange={(range) => onTrimChange(track.id, range)}
              onSeek={onPlayheadChange}
            />
          );
        })}
      </div>

      {markers && markers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {markers.map((m) => (
            <MonoLabel
              key={m.id}
              className="bg-popover border-border rounded border px-2 py-1 text-[9px]"
            >
              {m.label} @ {formatTimestamp(m.atSec)}
            </MonoLabel>
          ))}
        </div>
      ) : null}
    </AnalogCard>
  );
}
