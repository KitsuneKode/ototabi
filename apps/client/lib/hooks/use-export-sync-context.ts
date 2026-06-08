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
  const completedTrackSids = useMemo(
    () =>
      session?.tracks
        .filter((t) => t.status === "COMPLETED" && (t.s3Url || t.s3Key))
        .map((t) => t.trackSid) ?? [],
    [session?.tracks],
  );

  const trackAlignment = useMemo(
    () => getTrackAlignmentOffsets(syncMarkers, completedTrackSids),
    [syncMarkers, completedTrackSids],
  );

  const offsetByTrackSid = useMemo(() => alignmentOffsetsToMap(trackAlignment), [trackAlignment]);

  const completedTrackCount =
    session?.tracks.filter((t) => t.status === "COMPLETED" && (t.s3Url || t.s3Key)).length ?? 0;
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
