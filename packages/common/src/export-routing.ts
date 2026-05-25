/** Worker-first thresholds for full-session cloud exports (Plan 13 Phase 4). */
export const SESSION_EXPORT_WORKER_MIN_DURATION_SEC = 30 * 60;

/** Many completed tracks usually means a heavy browser merge — prefer cloud worker. */
export const SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS = 4;

export type SessionExportMetrics = {
  durationSec: number;
  completedTrackCount: number;
};

export type SessionExportRoute = "worker" | "browser";

export function exportSessionJobId(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
): string {
  return `export-session-${sessionId}-${preset}`;
}

export function resolveSessionDurationSec(input: {
  startedAt: Date;
  endedAt: Date | null;
  fallbackSec?: number;
}): number {
  if (input.endedAt) {
    const ms = input.endedAt.getTime() - input.startedAt.getTime();
    return Math.max(0, Math.round(ms / 1000));
  }
  return input.fallbackSec ?? 0;
}

/**
 * Long or multi-track sessions should use the BullMQ export worker instead of
 * in-browser FFmpeg merge/export (memory and tab stability).
 */
export function resolveSessionExportRoute(metrics: SessionExportMetrics): SessionExportRoute {
  if (metrics.durationSec >= SESSION_EXPORT_WORKER_MIN_DURATION_SEC) {
    return "worker";
  }
  if (metrics.completedTrackCount >= SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS) {
    return "worker";
  }
  return "browser";
}

export function shouldPreferWorkerExport(metrics: SessionExportMetrics): boolean {
  return resolveSessionExportRoute(metrics) === "worker";
}
