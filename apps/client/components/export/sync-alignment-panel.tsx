import { SessionTimeline } from "@/components/patterns/session-timeline";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { AlertTriangle } from "@/lib/icons";

type SyncAlignmentPanelProps = {
  syncOffsetMs: number;
  syncAlignmentWarnings: string[];
  timelineEvents: any[];
  isLoading: boolean;
};

export function SyncAlignmentPanel({
  syncOffsetMs,
  syncAlignmentWarnings,
  timelineEvents,
  isLoading,
}: SyncAlignmentPanelProps) {
  return (
    <div className="space-y-4">
      <PanelTitle label="Sync Tape" title="Session Timeline" />
      {syncOffsetMs > 0 ? (
        <MonoLabel className="text-accent block text-[10px]">
          Sync baseline: {syncOffsetMs}ms — applied to merge/export audio when processing
        </MonoLabel>
      ) : null}
      {syncAlignmentWarnings.map((warning) => (
        <div
          key={warning}
          className="border-led-on/30 bg-led-on/5 flex items-start gap-2 rounded border p-3"
        >
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{warning}</p>
        </div>
      ))}
      <SessionTimeline events={timelineEvents} isLoading={isLoading} />
    </div>
  );
}
