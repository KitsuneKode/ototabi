"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useExportConsoleStore } from "@/lib/stores/export-console-store";

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
