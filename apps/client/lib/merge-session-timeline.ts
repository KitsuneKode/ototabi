import {
  computeTrackAlignmentOffsets,
  getSyncAlignmentWarnings as getCommonSyncAlignmentWarnings,
  type SyncAlignmentResult,
  type SyncAlignmentWarningInput,
  type TrackAlignmentInput,
} from "@ototabi/common/sync-alignment";

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
  rtpTimestamp?: number | null;
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

/** Computes per-track alignment offsets based on sync markers */
export function getTrackAlignmentOffsets(
  syncMarkers: SyncMarkerInput[] | undefined,
  completedTrackSids: string[],
): SyncAlignmentResult {
  const trackBySid = new Map<string, TrackAlignmentInput>(
    completedTrackSids.map((trackSid) => [trackSid, { trackSid, markers: [] }]),
  );

  if (syncMarkers) {
    for (const marker of syncMarkers) {
      if (!marker.trackSid) continue;
      const track = trackBySid.get(marker.trackSid);
      if (track) {
        track.markers.push(marker);
      } else {
        trackBySid.set(marker.trackSid, {
          trackSid: marker.trackSid,
          markers: [marker],
        });
      }
    }
  }

  const tracks = [...trackBySid.values()];

  return computeTrackAlignmentOffsets(tracks);
}

export type { SyncAlignmentWarningInput };

/** Plan 03 slice: export-page alignment warnings before multi-track merge. */
export function getSyncAlignmentWarnings(params: SyncAlignmentWarningInput): string[] {
  return getCommonSyncAlignmentWarnings(params);
}

export function getSyncConfidenceWarning(params: SyncAlignmentWarningInput): string | null {
  return getSyncAlignmentWarnings(params)[0] ?? null;
}

export function alignmentOffsetsToMap(result: SyncAlignmentResult): Map<string, number> {
  return new Map(result.offsets.map((offset) => [offset.trackSid, offset.offsetMs]));
}

export function countDistinctSyncMarkerTracks(syncMarkers: SyncMarkerInput[] | undefined): number {
  const trackSids = new Set<string>();
  for (const marker of syncMarkers ?? []) {
    if (marker.trackSid) trackSids.add(marker.trackSid);
  }
  return trackSids.size;
}

/** @deprecated Use getTrackAlignmentOffsets instead */
export function getSyncMarkerOffsetMs(syncMarkers: SyncMarkerInput[] | undefined): number {
  if (!syncMarkers?.length) return 0;
  const sorted = [...syncMarkers].toSorted((a, b) => a.localTime - b.localTime);
  return sorted[0]?.localTime ?? 0;
}
