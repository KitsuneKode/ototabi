"use client";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

export type TimelineLiteTrack = {
  id: string;
  label: string;
  durationSec: number;
};

export type TimelineLiteMarker = {
  id: string;
  label: string;
  atSec: number;
};

/**
 * Foundation shell for trim + text layer editing — not full NLE parity.
 */
export function TimelineLite({
  tracks,
  markers,
  playheadSec = 0,
}: {
  tracks: TimelineLiteTrack[];
  markers?: TimelineLiteMarker[];
  playheadSec?: number;
}) {
  const maxDuration = Math.max(...tracks.map((t) => t.durationSec), 1);

  return (
    <AnalogCard className="space-y-4 p-4 md:p-6">
      <PanelTitle label="Timeline lite" title="Multi-track rail" />
      <MonoLabel>
        Playhead: {formatTimestamp(playheadSec)} / {formatTimestamp(maxDuration)}
      </MonoLabel>

      <div className="space-y-3">
        {tracks.map((track) => {
          const widthPct = Math.min(100, (track.durationSec / maxDuration) * 100);
          return (
            <AnalogInset key={track.id} className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <MonoLabel>{track.label}</MonoLabel>
                <MonoLabel className="text-[9px]">{formatTimestamp(track.durationSec)}</MonoLabel>
              </div>
              <div className="bg-popover relative h-8 overflow-hidden rounded border">
                <div
                  className="bg-accent/60 absolute top-0 left-0 h-full rounded-sm"
                  style={{ width: `${widthPct}%` }}
                />
                <div
                  className="bg-foreground absolute top-0 h-full w-0.5"
                  style={{ left: `${(playheadSec / maxDuration) * 100}%` }}
                />
              </div>
            </AnalogInset>
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
