"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { useBrowserFfmpegExport } from "@/lib/hooks/use-browser-ffmpeg-export";
import { useExportBillingGate } from "@/lib/hooks/use-export-billing-gate";
import {
  useExportConsole,
  useExportCutsWithPreview,
  useExportProcessing,
  useExportTrackSelection,
  useExportTrim,
} from "@/lib/hooks/use-export-console";
import { useExportSyncContext } from "@/lib/hooks/use-export-sync-context";
import { useExportTimeline } from "@/lib/hooks/use-export-timeline";
import { useAuthGate } from "@/lib/hooks/use-session";
import { useSessionReview } from "@/lib/hooks/use-session-review";
import { useTRPC } from "@/trpc/client";

export function useExportSessionPage(sessionId: string) {
  const trpc = useTRPC();
  const { sessionReady } = useAuthGate();

  const { canTextEdit, usageData, checkoutIsPending, startProCheckout } =
    useExportBillingGate(sessionId);

  const sessionReview = useSessionReview(sessionId);
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
  } = sessionReview;

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
  const {
    cutSegmentIds,
    previewCutRange,
    toggleCutSegment,
    setPreviewCutRange,
    cutPreviewSummary,
  } = useExportCutsWithPreview(transcriptSegments);

  const transcriptEndSec = transcriptSegments?.[transcriptSegments.length - 1]?.endTime;
  const exportTimeline = useExportTimeline(session, transcriptEndSec);

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

  const ffmpegExport = useBrowserFfmpegExport({
    sessionId,
    session,
    offsetByTrackSid,
    demoEdit,
    transcriptSegments,
  });

  const completedTracks = useMemo(
    () =>
      session?.tracks.filter(
        (t): t is SessionReviewTrack & { s3Url: string | null; s3Key: string } =>
          t.status === "COMPLETED",
      ) ?? [],
    [session?.tracks],
  );

  return {
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
    canTextEdit,
    usageData,
    checkoutIsPending,
    startProCheckout,
    trackAlignment,
    syncAlignmentWarnings,
    selectedTrackIds,
    toggleTrack,
    processingStatus,
    processingMode,
    progress,
    errorMessage,
    noiseReduction,
    setNoiseReduction,
    trimStart,
    trimEnd,
    trimTrackId,
    setTrimStart,
    setTrimEnd,
    setTrimTrackId,
    cutSegmentIds,
    previewCutRange,
    toggleCutSegment,
    setPreviewCutRange,
    cutPreviewSummary,
    exportTimeline,
    completedTracks,
    ...ffmpegExport,
  };
}
