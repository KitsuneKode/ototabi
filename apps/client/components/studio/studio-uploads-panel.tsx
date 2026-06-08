"use client";

import type { StudioUploadProgressEntry } from "@/lib/hooks/use-studio-page";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { CheckCircle, Radio } from "@/lib/icons";

type StudioUploadsPanelProps = {
  canControlStudio: boolean;
  progressMap: Map<string, StudioUploadProgressEntry>;
  localUserName?: string;
};

export function StudioUploadsPanel({
  canControlStudio,
  progressMap,
  localUserName,
}: StudioUploadsPanelProps) {
  if (canControlStudio) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <PanelTitle
          label="Track Upload Queues"
          title="Upload Monitor"
          className="border-border mb-4 border-b pb-3"
        />

        {progressMap.size === 0 ? (
          <AnalogInset className="flex flex-col items-center justify-center gap-3 border-dashed p-6 text-center">
            <Radio className="text-muted-foreground/30 h-8 w-8 animate-pulse" />
            <div className="space-y-1">
              <MonoLabel className="block">Standby Mode</MonoLabel>
              <p className="text-muted-foreground/60 max-w-[160px] font-mono text-[10px] leading-normal uppercase">
                Upload feeds populate once recorders activate.
              </p>
            </div>
          </AnalogInset>
        ) : (
          <div className="space-y-3.5">
            {Array.from(progressMap.entries()).map(([trackSid, data]) => (
              <UploadProgressCard key={trackSid} trackSid={trackSid} data={data} showType />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (progressMap.size === 0) return null;

  const ownTracks = Array.from(progressMap.entries()).filter(
    ([, data]) => data.name === localUserName,
  );
  if (ownTracks.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <PanelTitle
        label="Your Tracks"
        title="Upload Status"
        className="border-border mb-4 border-b pb-3"
      />
      <div className="space-y-3.5">
        {ownTracks.map(([trackSid, data]) => (
          <UploadProgressCard key={trackSid} trackSid={trackSid} data={data} />
        ))}
      </div>
    </div>
  );
}

type UploadProgressCardProps = {
  trackSid: string;
  data: StudioUploadProgressEntry;
  showType?: boolean;
};

function UploadProgressCard({ trackSid, data, showType }: UploadProgressCardProps) {
  return (
    <AnalogInset className="p-3">
      <div className="mb-2 flex items-center justify-between">
        {showType ? (
          <span className="text-foreground max-w-[120px] truncate text-xs font-bold uppercase">
            {data.name}
          </span>
        ) : (
          <MonoLabel className="text-[10px]">{data.type}</MonoLabel>
        )}
        {showType ? (
          <StatusBadge className="text-[10px]">{data.type}</StatusBadge>
        ) : data.progress === 100 ? (
          <span className="text-led-green flex items-center gap-0.5 font-mono text-[10px] font-bold">
            <CheckCircle className="h-3 w-3" />
            <span>DONE</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        <AnalogInset className="h-2 flex-1 p-0">
          <div
            className={`h-full rounded-sm transition-[width] duration-300 ${
              data.progress === 100
                ? "bg-led-green shadow-[0_0_5px_var(--color-led-green)]"
                : "bg-accent shadow-[0_0_5px_var(--color-accent-glow)]"
            }`}
            style={{ width: `${data.progress}%` }}
          />
        </AnalogInset>
        <span className="text-foreground min-w-[32px] text-right font-mono text-[10px] font-bold tabular-nums">
          {data.progress}%
        </span>
      </div>

      {showType ? (
        <div className="text-muted-foreground/60 mt-2 flex items-center justify-between font-mono text-[10px]">
          <span className="max-w-[140px] truncate uppercase">
            {data.totalParts
              ? `PART ${data.uploadedParts ?? 0}/${data.totalParts}`
              : `SID: ${trackSid.slice(-10)}`}
          </span>
          {data.progress === 100 ? (
            <span className="text-led-green flex items-center gap-0.5 font-bold">
              <CheckCircle className="h-3 w-3 shrink-0" />
              <span>SAVED</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </AnalogInset>
  );
}
