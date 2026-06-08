"use client";

import { useEffect, useMemo } from "react";

import type { TranscriptSegment } from "@/lib/trpc/router-types";

import { summarizeCutPreview } from "@/lib/cut-preview";

type UseExportCutPreviewParams = {
  transcriptSegments: TranscriptSegment[] | undefined;
  cutSegmentIds: string[];
  setPreviewCutRange: (range: { startTime: number; endTime: number } | null) => void;
};

export function useExportCutPreview({
  transcriptSegments,
  cutSegmentIds,
  setPreviewCutRange,
}: UseExportCutPreviewParams) {
  const cutPreviewSummary = useMemo(() => {
    if (!transcriptSegments?.length || cutSegmentIds.length === 0) return null;
    const cuts = transcriptSegments.filter(
      (s): s is TranscriptSegment & { startTime: number; endTime: number } =>
        cutSegmentIds.includes(s.id ?? "") && s.id != null,
    );
    const totalDuration = transcriptSegments[transcriptSegments.length - 1]?.endTime ?? 0;
    return summarizeCutPreview(cuts, totalDuration);
  }, [transcriptSegments, cutSegmentIds]);

  useEffect(() => {
    if (!cutPreviewSummary?.previewEnvelope) {
      if (cutSegmentIds.length === 0) setPreviewCutRange(null);
      return;
    }
    setPreviewCutRange(cutPreviewSummary.previewEnvelope);
  }, [cutPreviewSummary, cutSegmentIds.length, setPreviewCutRange]);

  return { cutPreviewSummary };
}
