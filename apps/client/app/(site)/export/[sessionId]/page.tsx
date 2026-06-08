"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { ClipRenderActions } from "@/components/clips/clip-render-actions";
import { SessionExportActions } from "@/components/clips/session-export-actions";
import { ExportTrackPreview } from "@/components/editor/export-track-preview";
import { TimelineLite } from "@/components/editor/timeline-lite";
import { BrowserExportPanel } from "@/components/export/browser-export-panel";
import { ExportBundlePicker } from "@/components/export/export-bundle-picker";
import { ExportProcessingPanel } from "@/components/export/export-processing-panel";
import { SyncAlignmentPanel } from "@/components/export/sync-alignment-panel";
import { TextEditPanel } from "@/components/export/text-edit-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { AnalogLoadingPanel, AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { AiArtifactActions } from "@/components/session-review/ai-artifact-actions";
import { AiPipelineStatus } from "@/components/session-review/ai-pipeline-status";
import { ShowNotesEditor } from "@/components/session-review/show-notes-editor";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDateTime, formatTimestamp } from "@/lib/date-utils";
import { useBrowserFfmpegExport } from "@/lib/hooks/use-browser-ffmpeg-export";
import { useExportBillingGate } from "@/lib/hooks/use-export-billing-gate";
import {
  useExportConsole,
  useExportCuts,
  useExportProcessing,
  useExportTrackSelection,
  useExportTrim,
} from "@/lib/hooks/use-export-console";
import { useExportCutPreview } from "@/lib/hooks/use-export-cut-preview";
import { useExportSyncContext } from "@/lib/hooks/use-export-sync-context";
import { useExportTimeline } from "@/lib/hooks/use-export-timeline";
import { useAuthGate } from "@/lib/hooks/use-session";
import { useSessionReview } from "@/lib/hooks/use-session-review";
import {
  ArrowLeft,
  Download,
  Mic,
  Video,
  Monitor,
  AlertTriangle,
  RefreshCw,
  Combine,
} from "@/lib/icons";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useTRPC } from "@/trpc/client";
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
    >
      <Download className="h-3.5 w-3.5" />
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

function exportProcIndicator(
  processingStatus: string,
  processingMode: string | null,
  progress: number,
) {
  const procColor =
    processingStatus === "processing" || processingStatus === "loading-ffmpeg"
      ? ("amber" as const)
      : processingStatus === "done"
        ? ("green" as const)
        : processingStatus === "error"
          ? ("red" as const)
          : ("green-off" as const);

  const procLabel =
    processingStatus === "loading-ffmpeg"
      ? "LOADING FFMPEG"
      : processingStatus === "processing"
        ? `${processingMode?.toUpperCase()} ${progress}%`
        : processingStatus === "done"
          ? "COMPLETE"
          : processingStatus === "error"
            ? "ERROR"
            : "STANDBY";

  return { procColor, procLabel };
}

export default function ExportSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const trpc = useTRPC();
  const { sessionReady } = useAuthGate();

  const { canTextEdit, usageData, checkoutIsPending, startProCheckout } =
    useExportBillingGate(sessionId);

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
    syncMarkers,
    timelineEvents,
    allUploaded,
    aggregateUploadStatus,
    isBootingAuth,
  } = useSessionReview(sessionId);

  const { data: demoSessionQueryData } = useQuery({
    ...trpc.demo.getSession.queryOptions({ sessionId }),
    enabled: sessionReady && Boolean(sessionId) && session?.mode === "DEMO",
  });

  const { trackAlignment, offsetByTrackSid, syncAlignmentWarnings } = useExportSyncContext(
    syncMarkers,
    session,
  );

  useExportConsole(sessionId);

  const { selectedTrackIds, toggleTrack } = useExportTrackSelection();
  const {
    processingStatus,
    processingMode,
    progress,
    errorMessage,
    noiseReduction,
    setNoiseReduction,
  } = useExportProcessing();
  const { trimStart, trimEnd, trimTrackId, setTrimStart, setTrimEnd, setTrimTrackId } =
    useExportTrim();
  const { cutSegmentIds, previewCutRange, toggleCutSegment, setPreviewCutRange } = useExportCuts();

  const transcriptEndSec = transcriptSegments?.[transcriptSegments.length - 1]?.endTime;
  const exportTimeline = useExportTimeline(session, transcriptEndSec);

  const { cutPreviewSummary } = useExportCutPreview({
    transcriptSegments,
    cutSegmentIds,
    setPreviewCutRange,
  });

  const demoEdit = useMemo(() => {
    const demo = demoSessionQueryData?.demo;
    if (!demo) return null;
    return {
      trimStartMs: demo.trimStartMs ?? null,
      trimEndMs: demo.trimEndMs ?? null,
      playbackSpeed: demo.playbackSpeed ?? 1,
      backgroundBlur: demo.backgroundBlur ?? 0,
      pipEnabled: demo.pipEnabled ?? true,
    };
  }, [demoSessionQueryData?.demo]);

  const { handleMerge, handleExportRes, handleDemoAspectExport, handleTrim, handleCuts } =
    useBrowserFfmpegExport({
      sessionId,
      session,
      offsetByTrackSid,
      demoEdit,
      transcriptSegments,
    });

  const { procColor, procLabel } = exportProcIndicator(processingStatus, processingMode, progress);

  if (isBootingAuth || query.isLoading) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <AnalogLoadingPanel label="Initializing export console..." />
      </AppShell>
    );
  }

  if (query.error || !session) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogStatePanel
          title="Session not found"
          message={`Export session "${sessionId.slice(-8).toUpperCase()}" could not be located.`}
          actionLabel="Return to dashboard"
          onAction={() => router.push("/dashboard")}
          icon={<AlertTriangle className="text-led-on h-12 w-12" />}
        />
      </div>
    );
  }

  const completedTracks = session.tracks.filter(
    (t): t is SessionReviewTrack & { s3Url: string | null; s3Key: string } =>
      t.status === "COMPLETED",
  );

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label={`SESSION: ${session.id.slice(-8).toUpperCase()} // ${session.room.name}`}
          title="Export Console"
          actions={
            <>
              <MechButton
                onClick={() => router.push("/dashboard")}
                className="h-9 px-2.5 py-2"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </MechButton>
              <div className="flex items-center gap-3">
                <Led
                  color={procColor}
                  size="sm"
                  pulse={processingStatus === "processing" || processingStatus === "loading-ffmpeg"}
                />
                <StatusBadge
                  variant={
                    processingStatus === "processing" || processingStatus === "loading-ffmpeg"
                      ? "warn"
                      : processingStatus === "done"
                        ? "ok"
                        : processingStatus === "error"
                          ? "recording"
                          : "default"
                  }
                >
                  {procLabel}
                </StatusBadge>
              </div>
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

        {showNotes ? (
          <ShowNotesEditor
            sessionId={sessionId}
            showNotes={showNotes}
            onSaved={() => void query.refetch()}
          />
        ) : null}

        {chapters && chapters.length > 0 ? (
          <AnalogCard className="p-6">
            <PanelTitle label="AI producer" title="Chapters" />
            <div className="mt-3 space-y-1">
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

        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Session ID", value: session.id.slice(-8).toUpperCase(), accent: true },
              { label: "Room Code", value: session.room.code, accent: false },
              {
                label: "Started At",
                value: formatDateTime(session.startedAt),
                accent: false,
              },
              { label: "Total Tracks", value: String(session.tracks.length), accent: true },
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

        <div className="space-y-4">
          <PanelTitle label="Source Tapes" title="Select Tracks" />

          {session.tracks.length === 0 ? (
            <AnalogCard className="p-12 text-center">
              <Combine className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
              <MonoLabel className="mb-2 block">No Tracks Available</MonoLabel>
              <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-xs leading-normal">
                This session has no recorded tracks to export.
              </p>
            </AnalogCard>
          ) : (
            <div className="space-y-2">
              {session.tracks.map((track) => {
                const Icon = TRACK_TYPE_ICON[track.type] ?? Mic;
                const isCompleted = track.status === "COMPLETED" && !!(track.s3Url || track.s3Key);
                const checked = selectedTrackIds.includes(track.id);

                return (
                  <AnalogInset key={track.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!isCompleted}
                            onChange={() => toggleTrack(track.id)}
                            className="accent-accent h-4 w-4"
                          />
                          <div className="bg-card border-border flex h-8 w-8 shrink-0 items-center justify-center rounded border">
                            <Icon className="text-muted-foreground h-4 w-4" />
                          </div>
                        </label>
                        <div>
                          <p className="text-sm font-bold tracking-tight uppercase">{track.type}</p>
                          <MonoLabel className="text-[9px]">
                            {track.user?.name ?? "Unknown"}
                          </MonoLabel>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TrackStatusBadge status={track.status} />

                        {isCompleted ? (
                          <TrackDownloadButton mediaRef={track.s3Url ?? track.s3Key} />
                        ) : track.status === "UPLOADING" ? (
                          <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px]">
                            <RefreshCw className="h-3 w-3 animate-spin" />
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

        {exportTimeline.hasTimeline ? (
          <div className="space-y-4">
            <PanelTitle label="Visual rail" title="Timeline & preview" />
            <ExportTrackPreview
              videoUrl={exportTimeline.previewVideoUrl}
              playheadSec={exportTimeline.playheadSec}
              onPlayheadChange={exportTimeline.setPlayheadSec}
              durationSec={exportTimeline.durationSec}
            />
            <TimelineLite
              tracks={exportTimeline.timelineTracks}
              durationSec={exportTimeline.durationSec}
              playheadSec={exportTimeline.playheadSec}
              activeTrackId={exportTimeline.activeTrackId}
              trimByTrackId={exportTimeline.trimByTrackId}
              onPlayheadChange={exportTimeline.setPlayheadSec}
              onActiveTrackChange={exportTimeline.onActiveTrackChange}
              onTrimChange={exportTimeline.onTrimChange}
            />
            <MonoLabel className="text-muted-foreground/70 block text-[9px] leading-relaxed">
              Scrub the rail or drag trim handles on the active lane — values sync to the trim deck
              and preview video below.
            </MonoLabel>
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
              <MonoLabel>Episode MP3</MonoLabel>
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
              <MonoLabel>Landscape 16:9</MonoLabel>
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

        {clipCandidates && clipCandidates.length > 0 ? (
          <div className="space-y-4">
            <PanelTitle label="Magic clips" title="Vertical clip pack" />
            <div className="space-y-3">
              {clipCandidates.map((clip) => (
                <AnalogInset key={clip.id} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <MonoLabel>
                      {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)} &bull;
                      score {(clip.score * 100).toFixed(0)}%
                    </MonoLabel>
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

        {transcriptSegments && transcriptSegments.length > 0 && completedTracks.length > 0 ? (
          <TextEditPanel
            canTextEdit={canTextEdit}
            usageData={usageData}
            checkoutIsPending={checkoutIsPending}
            startProCheckout={startProCheckout}
            transcriptSegments={transcriptSegments}
            cutSegmentIds={cutSegmentIds}
            toggleCutSegment={toggleCutSegment}
            previewCutRange={previewCutRange}
            cutPreviewSummary={cutPreviewSummary}
            setPreviewCutRange={setPreviewCutRange}
            handleCuts={handleCuts}
            processingStatus={processingStatus}
            processingMode={processingMode}
            selectedTrackIds={selectedTrackIds}
            errorMessage={errorMessage}
          />
        ) : null}

        <SyncAlignmentPanel
          referenceTrackSid={trackAlignment.referenceTrackSid}
          trackOffsets={trackAlignment.offsets}
          syncAlignmentWarnings={syncAlignmentWarnings}
          timelineEvents={timelineEvents}
          isLoading={query.isFetching && !query.data}
        />

        {completedTracks.length > 0 ? (
          <ExportProcessingPanel
            syncAlignmentWarnings={syncAlignmentWarnings}
            errorMessage={errorMessage}
            processingMode={processingMode}
            processingStatus={processingStatus}
            progress={progress}
            noiseReduction={noiseReduction}
            setNoiseReduction={setNoiseReduction}
            selectedTrackIds={selectedTrackIds}
            sessionMode={session.mode}
            handleMerge={handleMerge}
            handleExportRes={handleExportRes}
            handleDemoAspectExport={handleDemoAspectExport}
          />
        ) : null}

        {completedTracks.length > 0 ? (
          <BrowserExportPanel
            completedTracks={completedTracks}
            trimTrackId={trimTrackId}
            setTrimTrackId={setTrimTrackId}
            trimStart={trimStart}
            setTrimStart={setTrimStart}
            trimEnd={trimEnd}
            setTrimEnd={setTrimEnd}
            handleTrim={handleTrim}
            processingStatus={processingStatus}
            processingMode={processingMode}
            errorMessage={errorMessage}
          />
        ) : null}

        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <MechButton onClick={() => router.push(`/recordings/${sessionId}`)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Session Review
          </MechButton>
        </div>
      </div>
    </AppShell>
  );
}
