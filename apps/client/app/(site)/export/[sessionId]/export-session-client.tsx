"use client";

import { useParams, useRouter } from "next/navigation";

import { BrowserExportPanel } from "@/components/export/browser-export-panel";
import { ExportAiArtifactsSection } from "@/components/export/export-ai-artifacts-section";
import { ExportBundlePicker } from "@/components/export/export-bundle-picker";
import { ExportChaptersPanel } from "@/components/export/export-chapters-panel";
import { ExportClipsPanel } from "@/components/export/export-clips-panel";
import { ExportProcessingPanel } from "@/components/export/export-processing-panel";
import { ExportSessionFooter } from "@/components/export/export-session-footer";
import { ExportSessionHeaderActions } from "@/components/export/export-session-header-actions";
import { ExportSessionMetaCard } from "@/components/export/export-session-meta-card";
import { ExportTimelineSection } from "@/components/export/export-timeline-section";
import { ExportTrackSelectionList } from "@/components/export/export-track-selection-list";
import { ExportWorkerExportsPanel } from "@/components/export/export-worker-exports-panel";
import { SyncAlignmentPanel } from "@/components/export/sync-alignment-panel";
import { TextEditPanel } from "@/components/export/text-edit-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { AnalogLoadingPanel, AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { PanelTitle } from "@/components/ui/retro-primitives";
import { useExportSessionPage } from "@/lib/hooks/use-export-session-page";
import { AlertTriangle } from "@/lib/icons";

export default function ExportSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const page = useExportSessionPage(sessionId);
  const refetch = () => void page.query.refetch();

  if (page.isBootingAuth || page.query.isLoading) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <AnalogLoadingPanel label="Initializing export console..." />
      </AppShell>
    );
  }

  if (page.query.error || !page.session) {
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

  const { session } = page;
  const transcriptSegments = page.transcriptSegments;
  const showTextEdit =
    transcriptSegments !== undefined &&
    transcriptSegments.length > 0 &&
    page.completedTracks.length > 0;

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label={`SESSION: ${session.id.slice(-8).toUpperCase()} // ${session.room.name}`}
          title="Export Console"
          actions={
            <ExportSessionHeaderActions
              onBack={() => router.push("/dashboard")}
              processingStatus={page.processingStatus}
              processingMode={page.processingMode}
              progress={page.progress}
            />
          }
        />

        <SessionStatusRail uploadStatus={page.aggregateUploadStatus} syncOk={page.allUploaded} />

        <ExportAiArtifactsSection
          sessionId={sessionId}
          pipeline={page.pipeline}
          aiStatus={page.aiStatus}
          transcriptStatus={page.transcriptStatus}
          transcriptSegments={page.transcriptSegments}
          showNotes={page.showNotes}
          onRefetch={refetch}
        />

        {page.chapters && page.chapters.length > 0 ? (
          <ExportChaptersPanel chapters={page.chapters} />
        ) : null}

        <ExportSessionMetaCard session={session} />

        <ExportTrackSelectionList
          tracks={session.tracks}
          selectedTrackIds={page.selectedTrackIds}
          onToggleTrack={page.toggleTrack}
        />

        <ExportTimelineSection exportTimeline={page.exportTimeline} />

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

        {page.clipCandidates && page.clipCandidates.length > 0 ? (
          <ExportClipsPanel
            sessionId={sessionId}
            clipCandidates={page.clipCandidates}
            onQueued={refetch}
          />
        ) : null}

        {showTextEdit && transcriptSegments ? (
          <TextEditPanel
            canTextEdit={page.canTextEdit}
            usageData={page.usageData}
            checkoutIsPending={page.checkoutIsPending}
            startProCheckout={page.startProCheckout}
            transcriptSegments={transcriptSegments}
            cutSegmentIds={page.cutSegmentIds}
            toggleCutSegment={page.toggleCutSegment}
            previewCutRange={page.previewCutRange}
            cutPreviewSummary={page.cutPreviewSummary}
            setPreviewCutRange={page.setPreviewCutRange}
            handleCuts={page.handleCuts}
            processingStatus={page.processingStatus}
            processingMode={page.processingMode}
            selectedTrackIds={page.selectedTrackIds}
            errorMessage={page.errorMessage}
          />
        ) : null}

        <SyncAlignmentPanel
          referenceTrackSid={page.trackAlignment.referenceTrackSid}
          trackOffsets={page.trackAlignment.offsets}
          syncAlignmentWarnings={page.syncAlignmentWarnings}
          timelineEvents={page.timelineEvents}
          isLoading={page.query.isFetching && !page.query.data}
        />

        {page.completedTracks.length > 0 ? (
          <ExportProcessingPanel
            syncAlignmentWarnings={page.syncAlignmentWarnings}
            errorMessage={page.errorMessage}
            processingMode={page.processingMode}
            processingStatus={page.processingStatus}
            progress={page.progress}
            noiseReduction={page.noiseReduction}
            setNoiseReduction={page.setNoiseReduction}
            selectedTrackIds={page.selectedTrackIds}
            sessionMode={session.mode}
            handleMerge={page.handleMerge}
            handleExportRes={page.handleExportRes}
            handleDemoAspectExport={page.handleDemoAspectExport}
          />
        ) : null}

        {page.completedTracks.length > 0 ? (
          <BrowserExportPanel
            completedTracks={page.completedTracks}
            trimTrackId={page.trimTrackId}
            setTrimTrackId={page.setTrimTrackId}
            trimStart={page.trimStart}
            setTrimStart={page.setTrimStart}
            trimEnd={page.trimEnd}
            setTrimEnd={page.setTrimEnd}
            handleTrim={page.handleTrim}
            processingStatus={page.processingStatus}
            processingMode={page.processingMode}
            errorMessage={page.errorMessage}
          />
        ) : null}

        <ExportSessionFooter
          sessionId={sessionId}
          onDashboard={() => router.push("/dashboard")}
          onSessionReview={() => router.push(`/recordings/${sessionId}`)}
        />
      </div>
    </AppShell>
  );
}
