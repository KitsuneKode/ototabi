"use client";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { UploadStatusBadge } from "@/components/patterns/upload-status-badge";
import { mapTrackStatusToUploadDisplay } from "@/components/patterns/upload-status-utils";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { Download, Mic, Video, Monitor, RefreshCw, User, Film } from "@/lib/icons";

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
};

type RecordingParticipantTracksPanelProps = {
  tracksByUser: Record<string, SessionReviewTrack[]>;
  totalTracks: number;
};

export function RecordingParticipantTracksPanel({
  tracksByUser,
  totalTracks,
}: RecordingParticipantTracksPanelProps) {
  return (
    <div className="space-y-6">
      <PanelTitle label="Multi-Track Index" title="Participant Recordings" />

      {totalTracks === 0 ? (
        <AnalogCard className="p-12 text-center">
          <Film className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
          <MonoLabel className="mb-2 block">No Tracks Registered</MonoLabel>
          <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-xs leading-normal">
            Participants must upload their local recordings to populate this index.
          </p>
        </AnalogCard>
      ) : (
        Object.entries(tracksByUser).map(([userName, tracks]) => {
          const userUploaded = tracks.every((t) => t.status === "COMPLETED");
          return (
            <AnalogCard key={userName} className="p-6">
              <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-popover border-border flex h-8 w-8 items-center justify-center rounded border">
                    <User className="text-muted-foreground h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight uppercase">{userName}</p>
                    <MonoLabel>
                      {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                    </MonoLabel>
                  </div>
                </div>
                <StatusBadge variant={userUploaded ? "ok" : "warn"}>
                  <LedInline
                    color={userUploaded ? "green" : "amber"}
                    size="sm"
                    pulse={!userUploaded}
                  />
                  {userUploaded ? "COMPLETE" : "PENDING"}
                </StatusBadge>
              </div>

              <div className="space-y-3">
                {tracks.map((track) => {
                  const Icon = TRACK_TYPE_ICON[track.type] ?? Mic;
                  return (
                    <AnalogInset key={track.id} className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-card border-border flex h-8 w-8 shrink-0 items-center justify-center rounded border">
                            <Icon className="text-muted-foreground h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight uppercase">
                              {track.type}
                            </p>
                            <MonoLabel className="text-[9px]">
                              SID: {track.trackSid.slice(-12)}
                            </MonoLabel>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <UploadStatusBadge status={mapTrackStatusToUploadDisplay(track.status)} />

                          {track.status === "COMPLETED" && track.s3Url ? (
                            <a
                              href={track.s3Url}
                              download
                              className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold tracking-wider uppercase"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          ) : track.status === "UPLOADING" ? (
                            <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px]">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>In Progress</span>
                            </div>
                          ) : (
                            <MonoLabel className="text-led-on text-[9px]">
                              Upload Required
                            </MonoLabel>
                          )}
                        </div>
                      </div>

                      {track.status === "UPLOADING" ? (
                        <div className="mt-3">
                          <AnalogInset className="flex h-2 items-stretch p-0.5">
                            <div
                              className="animate-pulse rounded-sm"
                              style={{
                                width: "60%",
                                backgroundColor: "var(--accent)",
                              }}
                            />
                          </AnalogInset>
                        </div>
                      ) : null}
                    </AnalogInset>
                  );
                })}
              </div>
            </AnalogCard>
          );
        })
      )}
    </div>
  );
}
