import type { TrackAlignmentOffset } from "@ototabi/common/sync-alignment";

import type { SessionTimelineEvent } from "@/components/patterns/session-timeline";

import { AlignmentNotice } from "@/components/export/alignment-notice";
import { SessionTimeline } from "@/components/patterns/session-timeline";
import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
type SyncAlignmentPanelProps = {
  referenceTrackSid: string | null;
  trackOffsets: TrackAlignmentOffset[];
  syncAlignmentWarnings: string[];
  timelineEvents: SessionTimelineEvent[];
  isLoading: boolean;
};

function confidenceVariant(
  confidence: TrackAlignmentOffset["confidence"],
): "ok" | "warn" | "default" | "recording" {
  if (confidence === "high") return "ok";
  if (confidence === "medium") return "warn";
  if (confidence === "low") return "recording";
  return "default";
}

function confidenceLed(
  confidence: TrackAlignmentOffset["confidence"],
): "green" | "amber" | "red" | "green-off" {
  if (confidence === "high") return "green";
  if (confidence === "medium") return "amber";
  if (confidence === "low") return "red";
  return "green-off";
}

export function SyncAlignmentPanel({
  referenceTrackSid,
  trackOffsets,
  syncAlignmentWarnings,
  timelineEvents,
  isLoading,
}: SyncAlignmentPanelProps) {
  const hasOffsets = trackOffsets.some((o) => o.offsetMs !== 0 || o.markerCount > 0);

  return (
    <div className="space-y-4">
      <PanelTitle label="Sync Tape" title="Session Timeline" />
      {referenceTrackSid ? (
        <MonoLabel className="text-accent block text-[10px]">
          Reference track: {referenceTrackSid.slice(-8).toUpperCase()}
        </MonoLabel>
      ) : null}
      {hasOffsets ? (
        <AnalogInset className="overflow-x-auto p-3">
          <table className="w-full min-w-[320px] border-collapse font-mono text-[10px]">
            <thead>
              <tr className="text-muted-foreground text-left uppercase">
                <th className="pr-3 pb-2 font-normal">Track</th>
                <th className="pr-3 pb-2 font-normal">Offset</th>
                <th className="pr-3 pb-2 font-normal">Confidence</th>
                <th className="pb-2 font-normal">Reason</th>
              </tr>
            </thead>
            <tbody>
              {trackOffsets.map((row) => (
                <tr key={row.trackSid} className="border-border border-t">
                  <td className="text-foreground py-2 pr-3 tabular-nums">
                    {row.trackSid.slice(-8).toUpperCase()}
                    {row.trackSid === referenceTrackSid ? (
                      <span className="text-accent ml-1">(ref)</span>
                    ) : null}
                  </td>
                  <td className="text-accent py-2 pr-3 font-bold tabular-nums">{row.offsetMs}ms</td>
                  <td className="py-2 pr-3">
                    <StatusBadge variant={confidenceVariant(row.confidence)}>
                      <LedInline color={confidenceLed(row.confidence)} size="sm" />
                      {row.confidence.toUpperCase()}
                    </StatusBadge>
                  </td>
                  <td className="text-muted-foreground py-2 leading-relaxed">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalogInset>
      ) : null}
      <AlignmentNotice warnings={syncAlignmentWarnings} />
      <SessionTimeline events={timelineEvents} isLoading={isLoading} />
    </div>
  );
}
