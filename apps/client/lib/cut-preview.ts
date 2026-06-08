/** Time range in seconds (session timeline). */
export type TimeRange = { start: number; end: number };

export type CutSegmentInput = { startTime: number; endTime: number };

const CUT_GAP_SECONDS = 0.1;

export function computeKeepRanges(
  sortedCuts: CutSegmentInput[],
  totalDuration: number,
): TimeRange[] {
  if (sortedCuts.length === 0) return [{ start: 0, end: totalDuration }];

  const keepRanges: TimeRange[] = [];
  let currentStart = 0;

  for (const cut of sortedCuts) {
    if (cut.startTime > currentStart) {
      keepRanges.push({ start: currentStart, end: cut.startTime - CUT_GAP_SECONDS });
    }
    currentStart = cut.endTime + CUT_GAP_SECONDS;
  }

  if (currentStart < totalDuration) {
    keepRanges.push({ start: currentStart, end: totalDuration });
  }

  return keepRanges.filter((r) => r.end > r.start);
}

function computeCutPreviewEnvelope(
  cuts: CutSegmentInput[],
): { startTime: number; endTime: number } | null {
  if (cuts.length === 0) return null;
  const startTime = Math.min(...cuts.map((c) => c.startTime));
  const endTime = Math.max(...cuts.map((c) => c.endTime));
  return { startTime, endTime };
}

export type CutPreviewSummary = {
  cutCount: number;
  removeRanges: TimeRange[];
  keepRanges: TimeRange[];
  removedSeconds: number;
  keptSeconds: number;
  totalDuration: number;
  previewEnvelope: { startTime: number; endTime: number } | null;
};

export function summarizeCutPreview(
  cuts: CutSegmentInput[],
  totalDuration: number,
): CutPreviewSummary | null {
  if (cuts.length === 0 || totalDuration <= 0) return null;

  const sortedCuts = [...cuts].toSorted((a, b) => a.startTime - b.startTime);
  const removeRanges: TimeRange[] = sortedCuts.map((c) => ({
    start: c.startTime,
    end: c.endTime,
  }));
  const keepRanges = computeKeepRanges(sortedCuts, totalDuration);

  const removedSeconds = removeRanges.reduce((sum, r) => sum + (r.end - r.start), 0);
  const keptSeconds = keepRanges.reduce((sum, r) => sum + (r.end - r.start), 0);

  return {
    cutCount: cuts.length,
    removeRanges,
    keepRanges,
    removedSeconds,
    keptSeconds,
    totalDuration,
    previewEnvelope: computeCutPreviewEnvelope(sortedCuts),
  };
}
