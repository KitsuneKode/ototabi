/** Minimum gap between trim in/out handles (seconds). */
const MIN_TRIM_GAP_SEC = 0.5;

export type TrimRangeSec = {
  trimInSec: number;
  trimOutSec: number;
};

/** Clamp playhead to [0, duration]. */
export function clampPlayhead(sec: number, durationSec: number): number {
  if (!Number.isFinite(sec) || durationSec <= 0) return 0;
  return Math.min(Math.max(0, sec), durationSec);
}

/** Map seconds to horizontal percent on a timeline of given duration. */
export function secToPercent(sec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return (clampPlayhead(sec, durationSec) / durationSec) * 100;
}

/** Map pointer percent (0–100) back to seconds. */
export function percentToSec(percent: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  const clampedPct = Math.min(100, Math.max(0, percent));
  return clampPlayhead((clampedPct / 100) * durationSec, durationSec);
}

/**
 * Normalize trim handles so in < out, both within [0, duration], with min gap.
 */
export function normalizeTrimRange(
  trimInSec: number,
  trimOutSec: number,
  durationSec: number,
  minGapSec: number = MIN_TRIM_GAP_SEC,
): TrimRangeSec {
  if (durationSec <= 0) {
    return { trimInSec: 0, trimOutSec: 0 };
  }

  let trimIn = clampPlayhead(trimInSec, durationSec);
  let trimOut = clampPlayhead(trimOutSec, durationSec);

  if (trimOut <= trimIn) {
    trimOut = Math.min(durationSec, trimIn + minGapSec);
  }
  if (trimOut - trimIn < minGapSec) {
    if (trimIn + minGapSec <= durationSec) {
      trimOut = trimIn + minGapSec;
    } else {
      trimIn = Math.max(0, trimOut - minGapSec);
    }
  }

  return {
    trimInSec: trimIn,
    trimOutSec: Math.min(trimOut, durationSec),
  };
}

/** Clamp a single trim handle while respecting the opposite handle. */
export function clampTrimHandle(
  valueSec: number,
  oppositeSec: number,
  durationSec: number,
  edge: "in" | "out",
  minGapSec: number = MIN_TRIM_GAP_SEC,
): number {
  const value = clampPlayhead(valueSec, durationSec);
  const opposite = clampPlayhead(oppositeSec, durationSec);

  if (edge === "in") {
    const maxIn = Math.max(0, opposite - minGapSec);
    return Math.min(value, maxIn);
  }

  const minOut = Math.min(durationSec, opposite + minGapSec);
  return Math.max(value, minOut);
}

/** Parse trim form strings; returns null when empty/invalid. */
export function parseTrimField(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
