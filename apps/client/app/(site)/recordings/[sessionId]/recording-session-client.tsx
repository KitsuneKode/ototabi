"use client";

import { useParams, useRouter } from "next/navigation";

import { RecordingTimelineShell } from "@/components/editor/recording-timeline-shell";
import { ExportBundlePicker } from "@/components/export/export-bundle-picker";
import { ExportClipsPanel } from "@/components/export/export-clips-panel";
import { ExportSessionMetaCard } from "@/components/export/export-session-meta-card";
import { ExportWorkerExportsPanel } from "@/components/export/export-worker-exports-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { AnalogLoadingPanel, AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { RecordingEventTimelineSection } from "@/components/recordings/recording-event-timeline-section";
import { RecordingParticipantTracksPanel } from "@/components/recordings/recording-participant-tracks-panel";
import { RecordingSessionFooter } from "@/components/recordings/recording-session-footer";
import { RecordingSessionHeaderActions } from "@/components/recordings/recording-session-header-actions";
import { RecordingShowNotesSection } from "@/components/recordings/recording-show-notes-section";
import { RecordingTranscriptEmptyPanel } from "@/components/recordings/recording-transcript-empty-panel";
import { RecordingTranscriptSection } from "@/components/recordings/recording-transcript-section";
import { AiArtifactActions } from "@/components/session-review/ai-artifact-actions";
import { AiPipelineStatus } from "@/components/session-review/ai-pipeline-status";
import { PanelTitle } from "@/components/ui/retro-primitives";
import { useRecordingSessionPage } from "@/lib/hooks/use-recording-session-page";
import { AlertTriangle } from "@/lib/icons";

export default function RecordingSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const page = useRecordingSessionPage(sessionId);
  const refetch = () => void page.query.refetch();

  if (page.isBootingAuth || page.query.isLoading) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <AnalogLoadingPanel label="Loading session tapes..." />
      </AppShell>
    );
  }

  if (page.query.error || !page.session) {
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

  const { session } = page;
  const hasTranscript = (page.transcriptSegments?.length ?? 0) > 0;

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label={`REEL: ${session.id.slice(-8).toUpperCase()} // ${session.room.name}`}
          title="Session Review"
          actions={
            <RecordingSessionHeaderActions
              onBack={() => router.push("/dashboard")}
              allUploaded={page.allUploaded}
            />
          }
        />

        <SessionStatusRail uploadStatus={page.aggregateUploadStatus} syncOk={page.allUploaded} />

        {page.pipeline ? (
          <AiPipelineStatus pipeline={page.pipeline} aiStatus={page.aiStatus ?? "pending"} />
        ) : null}

        {hasTranscript && page.pipeline ? (
          <AiArtifactActions
            sessionId={sessionId}
            hasTranscript={hasTranscript}
            transcriptStatus={page.transcriptStatus ?? "none"}
            pipeline={page.pipeline}
            onQueued={refetch}
          />
        ) : null}

        <ExportSessionMetaCard session={session} />

        <RecordingParticipantTracksPanel
          tracksByUser={page.tracksByUser}
          totalTracks={page.totalTracks}
        />

        <RecordingEventTimelineSection
          events={page.timelineEvents}
          isLoading={page.query.isFetching && !page.query.data}
        />

        <RecordingTimelineShell
          session={session}
          chapterMarkers={
            page.chapters?.map((ch) => ({
              id: ch.id,
              label: ch.title,
              atSec: ch.startTime,
            })) ?? []
          }
        />

        <RecordingShowNotesSection
          sessionId={sessionId}
          showNotes={page.showNotes}
          aiStatus={page.aiStatus}
          onSaved={refetch}
        />

        {page.clipCandidates && page.clipCandidates.length > 0 ? (
          <ExportClipsPanel
            sessionId={sessionId}
            clipCandidates={page.clipCandidates}
            onQueued={refetch}
          />
        ) : null}

        {page.transcriptSegments && page.transcriptSegments.length > 0 ? (
          <RecordingTranscriptSection
            sessionId={sessionId}
            transcriptSegments={page.transcriptSegments}
            chapters={page.chapters}
          />
        ) : null}

        <div className="space-y-4">
          <PanelTitle label="Distribution" title="Export bundle" />
          <ExportBundlePicker sessionId={sessionId} assets={page.exportAssets} />
        </div>

        {page.exports ? (
          <ExportWorkerExportsPanel
            sessionId={sessionId}
            exports={page.exports}
            onQueued={refetch}
          />
        ) : null}

        {page.query.isSuccess && !hasTranscript ? (
          <RecordingTranscriptEmptyPanel
            sessionId={sessionId}
            transcriptStatus={page.transcriptStatus}
            onQueued={refetch}
          />
        ) : null}

        <RecordingSessionFooter
          roomCode={session.room.code}
          onDashboard={() => router.push("/dashboard")}
        />
      </div>
    </AppShell>
  );
}
