"use client";

import { useMemo } from "react";

import type { SessionReviewBundle, SessionReviewSession } from "@/lib/trpc/router-types";

import {
  alignmentOffsetsToMap,
  countDistinctSyncMarkerTracks,
  getSyncAlignmentWarnings,
  getTrackAlignmentOffsets,
} from "@/lib/merge-session-timeline";

export function useExportSyncContext(
  syncMarkers: SessionReviewBundle["syncMarkers"] | undefined,
  session: SessionReviewSession | undefined,
) {
  const tracks = session?.tracks;
  const { completedTrackSids, completedTrackCount } = useMemo(() => {
    const sids: string[] = [];
    let count = 0;
    for (const track of tracks ?? []) {
      if (track.status === "COMPLETED" && (track.s3Url || track.s3Key)) {
        sids.push(track.trackSid);
        count += 1;
      }
    }
    return { completedTrackSids: sids, completedTrackCount: count };
  }, [tracks]);

  const trackAlignment = useMemo(
    () => getTrackAlignmentOffsets(syncMarkers, completedTrackSids),
    [syncMarkers, completedTrackSids],
  );

  const offsetByTrackSid = useMemo(() => alignmentOffsetsToMap(trackAlignment), [trackAlignment]);

  const distinctMarkerTrackCount = countDistinctSyncMarkerTracks(syncMarkers);
  const syncAlignmentWarnings = getSyncAlignmentWarnings({
    syncMarkerCount: syncMarkers?.length ?? 0,
    completedTrackCount,
    distinctMarkerTrackCount,
  });

  return {
    trackAlignment,
    offsetByTrackSid,
    syncAlignmentWarnings,
    completedTrackCount,
    distinctMarkerTrackCount,
  };
}
