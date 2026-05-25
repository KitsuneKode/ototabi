import type { SessionTimelineEvent } from "@/components/patterns/session-timeline";

type RecordingEventInput = {
  id: string;
  type: string;
  occurredAt: Date | string;
  trackSid?: string | null;
  message?: string | null;
  user?: { name: string | null } | null;
};

type SyncMarkerInput = {
  id: string;
  localTime: number;
  createdAt: Date | string;
  trackSid?: string | null;
};

export function mergeSessionTimelineEvents(
  recordingEvents: RecordingEventInput[] | undefined,
  syncMarkers: SyncMarkerInput[] | undefined,
): SessionTimelineEvent[] {
  const fromEvents: SessionTimelineEvent[] = (recordingEvents ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    occurredAt: e.occurredAt,
    trackSid: e.trackSid,
    message: e.message,
    user: e.user,
  }));

  const fromMarkers: SessionTimelineEvent[] = (syncMarkers ?? []).map((m) => ({
    id: m.id,
    type: "SYNC_MARKER",
    occurredAt: m.createdAt,
    trackSid: m.trackSid,
    message: `Clock pulse @ ${Math.round(m.localTime)}ms local`,
    user: null,
  }));

  return [...fromEvents, ...fromMarkers].toSorted(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

/** First sync marker localTime (ms) as export alignment offset. */
export function getSyncMarkerOffsetMs(syncMarkers: SyncMarkerInput[] | undefined): number {
  if (!syncMarkers?.length) return 0;
  const sorted = [...syncMarkers].toSorted((a, b) => a.localTime - b.localTime);
  return sorted[0]?.localTime ?? 0;
}

export type SyncAlignmentWarningInput = {
  syncMarkerCount: number;
  completedTrackCount: number;
  distinctMarkerTrackCount?: number;
};

/** Plan 03 slice: export-page alignment warnings before multi-track merge. */
export function getSyncAlignmentWarnings(params: SyncAlignmentWarningInput): string[] {
  if (params.completedTrackCount < 2) return [];

  const warnings: string[] = [];

  if (params.syncMarkerCount === 0) {
    warnings.push(
      "No sync markers recorded — multi-track merge/export may be out of phase. Use clock pulses in the studio before exporting.",
    );
    return warnings;
  }

  if (params.syncMarkerCount < 3) {
    warnings.push(
      "Few sync pulses recorded — alignment confidence is low. Re-export after a session with steady clock markers.",
    );
  }

  const distinctTracks = params.distinctMarkerTrackCount ?? 0;
  if (
    distinctTracks > 0 &&
    distinctTracks < params.completedTrackCount &&
    params.completedTrackCount >= 2
  ) {
    warnings.push(
      `Sync markers cover ${distinctTracks} of ${params.completedTrackCount} tracks — some sources may drift relative to the baseline.`,
    );
  }

  return warnings;
}

export function getSyncConfidenceWarning(params: SyncAlignmentWarningInput): string | null {
  return getSyncAlignmentWarnings(params)[0] ?? null;
}

export function countDistinctSyncMarkerTracks(syncMarkers: SyncMarkerInput[] | undefined): number {
  const trackSids = new Set<string>();
  for (const marker of syncMarkers ?? []) {
    if (marker.trackSid) trackSids.add(marker.trackSid);
  }
  return trackSids.size;
}
