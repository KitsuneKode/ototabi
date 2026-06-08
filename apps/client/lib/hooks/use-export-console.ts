"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import type { TranscriptSegment } from "@/lib/trpc/router-types";

import { summarizeCutPreview } from "@/lib/cut-preview";
import { useExportConsoleStore } from "@/lib/stores/export-console-store";

function toggleSegmentId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function summarizeCutsFromTranscript(
  transcriptSegments: TranscriptSegment[] | undefined,
  cutSegmentIds: string[],
) {
  if (!transcriptSegments?.length || cutSegmentIds.length === 0) return null;
  const cuts = transcriptSegments.filter(
    (s): s is TranscriptSegment & { startTime: number; endTime: number } =>
      cutSegmentIds.includes(s.id ?? "") && s.id != null,
  );
  const totalDuration = transcriptSegments[transcriptSegments.length - 1]?.endTime ?? 0;
  return summarizeCutPreview(cuts, totalDuration);
}

/** Resets export UI state when navigating between sessions. */
export function useExportConsole(sessionId: string) {
  const bindSession = useExportConsoleStore((s) => s.bindSession);

  useEffect(() => {
    bindSession(sessionId);
  }, [sessionId, bindSession]);
}

export function useExportProcessing() {
  return useExportConsoleStore(
    useShallow((s) => ({
      ffmpegLoaded: s.ffmpegLoaded,
      processingStatus: s.processingStatus,
      processingMode: s.processingMode,
      progress: s.progress,
      errorMessage: s.errorMessage,
      noiseReduction: s.noiseReduction,
      setFfmpegLoaded: s.setFfmpegLoaded,
      beginProcessing: s.beginProcessing,
      setProcessingStatus: s.setProcessingStatus,
      setProgress: s.setProgress,
      setErrorMessage: s.setErrorMessage,
      setNoiseReduction: s.setNoiseReduction,
    })),
  );
}

export function useExportTrackSelection() {
  return useExportConsoleStore(
    useShallow((s) => ({
      selectedTrackIds: s.selectedTrackIds,
      toggleTrack: s.toggleTrack,
    })),
  );
}

export function useExportTrim() {
  return useExportConsoleStore(
    useShallow((s) => ({
      trimStart: s.trimStart,
      trimEnd: s.trimEnd,
      trimTrackId: s.trimTrackId,
      setTrimStart: s.setTrimStart,
      setTrimEnd: s.setTrimEnd,
      setTrimTrackId: s.setTrimTrackId,
    })),
  );
}

export function useExportCuts() {
  return useExportConsoleStore(
    useShallow((s) => ({
      cutSegmentIds: s.cutSegmentIds,
      previewCutRange: s.previewCutRange,
      toggleCutSegment: s.toggleCutSegment,
      clearCutSegments: s.clearCutSegments,
      setPreviewCutRange: s.setPreviewCutRange,
    })),
  );
}

/** Cut selection with derived preview summary — syncs preview range on toggle (no effect). */
export function useExportCutsWithPreview(transcriptSegments?: TranscriptSegment[]) {
  const cutSegmentIds = useExportConsoleStore((s) => s.cutSegmentIds);
  const previewCutRange = useExportConsoleStore((s) => s.previewCutRange);
  const toggleCutSegmentStore = useExportConsoleStore((s) => s.toggleCutSegment);
  const clearCutSegmentsStore = useExportConsoleStore((s) => s.clearCutSegments);
  const setPreviewCutRange = useExportConsoleStore((s) => s.setPreviewCutRange);

  const cutPreviewSummary = useMemo(
    () => summarizeCutsFromTranscript(transcriptSegments, cutSegmentIds),
    [transcriptSegments, cutSegmentIds],
  );

  const toggleCutSegment = useCallback(
    (segmentId: string) => {
      const nextIds = toggleSegmentId(cutSegmentIds, segmentId);
      toggleCutSegmentStore(segmentId);
      if (nextIds.length === 0) {
        setPreviewCutRange(null);
        return;
      }
      const summary = summarizeCutsFromTranscript(transcriptSegments, nextIds);
      setPreviewCutRange(summary?.previewEnvelope ?? null);
    },
    [cutSegmentIds, toggleCutSegmentStore, transcriptSegments, setPreviewCutRange],
  );

  const clearCutSegments = useCallback(() => {
    clearCutSegmentsStore();
  }, [clearCutSegmentsStore]);

  return {
    cutSegmentIds,
    previewCutRange,
    toggleCutSegment,
    clearCutSegments,
    setPreviewCutRange,
    cutPreviewSummary,
  };
}
