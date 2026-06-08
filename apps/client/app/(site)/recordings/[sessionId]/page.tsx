"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ClipRenderActions } from "@/components/clips/clip-render-actions";
import { SessionExportActions } from "@/components/clips/session-export-actions";
import { RecordingTimelineShell } from "@/components/editor/recording-timeline-shell";
import { TranscriptEditor } from "@/components/editor/transcript-editor";
import { ExportBundlePicker } from "@/components/export/export-bundle-picker";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { AnalogLoadingPanel, AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { SessionTimeline } from "@/components/patterns/session-timeline";
import {
  mapTrackStatusToUploadDisplay,
  UploadStatusBadge,
} from "@/components/patterns/upload-status-badge";
import { AiArtifactActions } from "@/components/session-review/ai-artifact-actions";
import { AiPipelineStatus } from "@/components/session-review/ai-pipeline-status";
import { ShowNotesEditor } from "@/components/session-review/show-notes-editor";
import { TranscriptRetryActions } from "@/components/session-review/transcript-retry-actions";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDateTime, formatTimestamp } from "@/lib/date-utils";
import { useSessionReview } from "@/lib/hooks/use-session-review";
import {
  ArrowLeft,
  Download,
  Mic,
  Video,
  Monitor,
  AlertTriangle,
  RefreshCw,
  User,
  Film,
  BookOpen,
} from "@/lib/icons";
const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
};

export default function RecordingSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const {
    query,
    session,
    transcriptSegments,
    chapters,
    showNotes,
    clipCandidates,
    aiStatus,
    transcriptStatus,
    pipeline,
    exports,
    exportAssets,
    timelineEvents,
    allUploaded,
    aggregateUploadStatus,
    isBootingAuth,
  } = useSessionReview(sessionId);

  if (isBootingAuth || query.isLoading) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <AnalogLoadingPanel label="Loading session tapes..." />
      </AppShell>
    );
  }

  if (query.error || !session) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogStatePanel
          title="Session not found"
          message={`Recording session "${sessionId.slice(-8).toUpperCase()}" could not be located.`}
          actionLabel="Return to dashboard"
          onAction={() => router.push("/dashboard")}
          icon={<AlertTriangle className="text-led-on h-12 w-12" />}
        />
      </div>
    );
  }

  const data = session;
  const totalTracks = data.tracks.length;

  // Group tracks by participant
  const byUser = data.tracks.reduce<Record<string, typeof data.tracks>>((acc, track) => {
    const key = track.user?.name ?? "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(track);
    return acc;
  }, {});

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label={`REEL: ${data.id.slice(-8).toUpperCase()} // ${data.room.name}`}
          title="Session Review"
          actions={
            <>
              <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
                <ArrowLeft className="h-4 w-4" />
              </MechButton>
              <StatusBadge variant={allUploaded ? "ok" : "warn"}>
                <LedInline color={allUploaded ? "green" : "amber"} size="sm" pulse={!allUploaded} />
                {allUploaded ? "ALL UPLOADED" : "SYNC PENDING"}
              </StatusBadge>
            </>
          }
        />

        <SessionStatusRail uploadStatus={aggregateUploadStatus} syncOk={allUploaded} />

        {pipeline ? (
          <AiPipelineStatus pipeline={pipeline} aiStatus={aiStatus ?? "pending"} />
        ) : null}

        {(transcriptSegments?.length ?? 0) > 0 && pipeline ? (
          <AiArtifactActions
            sessionId={sessionId}
            hasTranscript={(transcriptSegments?.length ?? 0) > 0}
            transcriptStatus={transcriptStatus ?? "none"}
            pipeline={pipeline}
            onQueued={() => void query.refetch()}
          />
        ) : null}

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                label: "Session ID",
                value: data.id.slice(-8).toUpperCase(),
                accent: true,
              },
              {
                label: "Room Code",
                value: data.room.code,
                accent: false,
              },
              {
                label: "Started At",
                value: formatDateTime(data.startedAt),
                accent: false,
              },
              {
                label: "Total Tracks",
                value: String(totalTracks),
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <AnalogInset key={label} className="flex flex-col gap-1.5 p-4">
                <MonoLabel>{label}</MonoLabel>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}
                >
                  {value}
                </span>
              </AnalogInset>
            ))}
          </div>
        </AnalogCard>

        {/* ── Tracks by Participant ─────────────────────────────────────── */}
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
            Object.entries(byUser).map(([userName, tracks]) => {
              const userUploaded = tracks.every((t) => t.status === "COMPLETED");
              return (
                <AnalogCard key={userName} className="p-6">
                  {/* Participant header */}
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

                  {/* Track list */}
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
                              <UploadStatusBadge
                                status={mapTrackStatusToUploadDisplay(track.status)}
                              />

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

                          {/* Upload progress bar for uploading tracks */}
                          {track.status === "UPLOADING" && (
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
                          )}
                        </AnalogInset>
                      );
                    })}
                  </div>
                </AnalogCard>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <PanelTitle label="Event Tape" title="Recording Timeline" />
          <SessionTimeline events={timelineEvents} isLoading={query.isFetching && !query.data} />
        </div>

        <RecordingTimelineShell
          session={data}
          chapterMarkers={
            chapters?.map((ch) => ({
              id: ch.id,
              label: ch.title,
              atSec: ch.startTime,
            })) ?? []
          }
        />

        {showNotes ? (
          <ShowNotesEditor
            sessionId={sessionId}
            showNotes={showNotes}
            onSaved={() => void query.refetch()}
          />
        ) : aiStatus === "processing" ? (
          <AnalogCard className="p-6 text-center">
            <MonoLabel>AI processing transcript, chapters, and clips…</MonoLabel>
          </AnalogCard>
        ) : null}

        {clipCandidates && clipCandidates.length > 0 ? (
          <div className="space-y-4">
            <PanelTitle label="Magic clips" title="Vertical clip pack" />
            <div className="space-y-3">
              {clipCandidates.map((clip) => (
                <AnalogInset key={clip.id} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <MonoLabel>
                        {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)} &bull;
                        score {(clip.score * 100).toFixed(0)}%
                      </MonoLabel>
                      <p className="text-muted-foreground mt-2 font-mono text-[10px] leading-relaxed">
                        {clip.rationale}
                      </p>
                    </div>
                    <ClipRenderActions
                      sessionId={sessionId}
                      clipId={clip.id}
                      renderStatus={clip.renderStatus}
                      renderS3Key={clip.renderS3Key}
                      renderError={clip.renderError}
                      onQueued={() => void query.refetch()}
                    />
                  </div>
                </AnalogInset>
              ))}
            </div>
          </div>
        ) : null}

        {transcriptSegments && transcriptSegments.length > 0 ? (
          <div className="space-y-4">
            {chapters && chapters.length > 0 ? (
              <AnalogCard className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="text-accent h-4 w-4" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">Chapters</h3>
                </div>
                <div className="space-y-1">
                  {chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className="border-border bg-popover flex items-center gap-3 rounded border px-3 py-2"
                    >
                      <MonoLabel className="text-accent shrink-0">
                        {formatTimestamp(ch.startTime)}
                      </MonoLabel>
                      <span className="text-foreground font-mono text-xs">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </AnalogCard>
            ) : null}
            <TranscriptEditor segments={transcriptSegments} />
            <Link
              href={`/export/${sessionId}`}
              className="text-accent inline-block font-mono text-xs font-bold tracking-widest uppercase"
            >
              Open export console for text-based cuts →
            </Link>
          </div>
        ) : null}

        <div className="space-y-4">
          <PanelTitle label="Distribution" title="Export bundle" />
          <ExportBundlePicker sessionId={sessionId} assets={exportAssets} />
        </div>

        {exports ? (
          <div className="space-y-4">
            <PanelTitle label="Cloud worker" title="Full-session exports" />
            <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel>Episode MP3 (full mic/camera audio)</MonoLabel>
              <SessionExportActions
                sessionId={sessionId}
                preset="episode_mp3"
                label="episode MP3"
                downloadLabel="Download MP3"
                exportSlot={exports.episodeMp3}
                onQueued={() => void query.refetch()}
              />
            </AnalogInset>
            <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel>Landscape 16:9 (full session)</MonoLabel>
              <SessionExportActions
                sessionId={sessionId}
                preset="landscape_16_9"
                label="landscape"
                downloadLabel="Download 16:9"
                exportSlot={exports.landscape}
                onQueued={() => void query.refetch()}
              />
            </AnalogInset>
          </div>
        ) : null}

        {query.isSuccess && (transcriptSegments?.length ?? 0) === 0 ? (
          <AnalogCard className="flex flex-col items-center gap-4 p-8 text-center">
            <MonoLabel className="text-muted-foreground">
              No transcript yet. Stop a session with uploaded audio, Redis, worker, and
              OPENAI_API_KEY configured to generate one.
            </MonoLabel>
            {transcriptStatus ? (
              <TranscriptRetryActions
                sessionId={sessionId}
                transcriptStatus={transcriptStatus}
                onQueued={() => void query.refetch()}
              />
            ) : null}
          </AnalogCard>
        ) : null}

        {/* ── Session Footer Note ───────────────────────────────────────── */}
        <AnalogCard className="flex items-start gap-3 p-5">
          <Led color="green" size="sm" className="mt-0.5 shrink-0" />
          <div>
            <MonoLabel className="mb-1 block">System Note</MonoLabel>
            <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
              Tracks are uploaded directly from participants&apos; browser IndexedDB storage. If a
              participant closed their tab before upload completed, they must reopen the recording
              recovery console to resume. Download links are valid after full upload completion.
            </p>
          </div>
        </AnalogCard>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <Link
            href={`/rooms/${data.room.code}/settings`}
            className="text-muted-foreground hover:text-accent font-mono text-xs font-bold tracking-widest uppercase transition-colors"
          >
            Room Settings →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
