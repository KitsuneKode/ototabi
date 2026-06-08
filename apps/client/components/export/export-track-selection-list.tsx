"use client";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { Combine, Download, Mic, Monitor, RefreshCw, Video } from "@/lib/icons";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { trpcClient } from "@/trpc/vanilla";

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
};

function TrackDownloadButton({ mediaRef }: { mediaRef: string }) {
  const handleDownload = async () => {
    const url = await resolveTrackDownloadUrl(trpcClient, mediaRef);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <MechButton
      type="button"
      onClick={() => void handleDownload()}
      className="text-secondary-foreground inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
      aria-label="Download track"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      Download
    </MechButton>
  );
}

function TrackStatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <StatusBadge variant="ok">
        <LedInline color="green" size="sm" />
        UPLOADED
      </StatusBadge>
    );
  }
  if (status === "UPLOADING") {
    return (
      <StatusBadge variant="warn">
        <LedInline color="amber" size="sm" pulse />
        UPLOADING
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="recording">
      <LedInline color="red" size="sm" />
      FAILED
    </StatusBadge>
  );
}

type ExportTrackSelectionListProps = {
  tracks: SessionReviewTrack[];
  selectedTrackIds: string[];
  onToggleTrack: (trackId: string) => void;
};

export function ExportTrackSelectionList({
  tracks,
  selectedTrackIds,
  onToggleTrack,
}: ExportTrackSelectionListProps) {
  return (
    <div className="space-y-4">
      <PanelTitle label="Source Tapes" title="Select Tracks" />

      {tracks.length === 0 ? (
        <AnalogCard className="p-12 text-center">
          <Combine className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" aria-hidden />
          <MonoLabel className="mb-2 block">No Tracks Available</MonoLabel>
          <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-xs leading-normal">
            This session has no recorded tracks to export.
          </p>
        </AnalogCard>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => {
            const Icon = TRACK_TYPE_ICON[track.type] ?? Mic;
            const isCompleted = track.status === "COMPLETED" && !!(track.s3Url || track.s3Key);
            const checked = selectedTrackIds.includes(track.id);
            const participant = track.user?.name ?? "Unknown";

            return (
              <AnalogInset key={track.id} className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!isCompleted}
                        onChange={() => onToggleTrack(track.id)}
                        className="accent-accent h-4 w-4"
                        aria-label={`Select ${track.type} track for ${participant}`}
                      />
                      <div className="bg-card border-border flex h-8 w-8 shrink-0 items-center justify-center rounded border">
                        <Icon className="text-muted-foreground h-4 w-4" aria-hidden />
                      </div>
                    </label>
                    <div>
                      <p className="text-sm font-bold tracking-tight uppercase">{track.type}</p>
                      <MonoLabel className="text-[9px]">{participant}</MonoLabel>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <TrackStatusBadge status={track.status} />

                    {isCompleted ? (
                      <TrackDownloadButton mediaRef={track.s3Url ?? track.s3Key ?? ""} />
                    ) : track.status === "UPLOADING" ? (
                      <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px]">
                        <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />
                        <span>In Progress</span>
                      </div>
                    ) : (
                      <MonoLabel className="text-led-on text-[9px]">Upload Required</MonoLabel>
                    )}
                  </div>
                </div>
              </AnalogInset>
            );
          })}
        </div>
      )}
    </div>
  );
}
