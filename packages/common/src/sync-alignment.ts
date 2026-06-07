export type SyncMarkerPoint = {
  id: string;
  userId?: string | null;
  trackSid?: string | null;
  localTime: number;
  rtpTimestamp?: number | null;
  createdAt?: Date | string;
};

export type TrackAlignmentInput = {
  trackSid: string;
  userId?: string | null;
  markers: SyncMarkerPoint[];
};

export type TrackAlignmentOffset = {
  trackSid: string;
  offsetMs: number;
  confidence: "high" | "medium" | "low" | "none";
  markerCount: number;
  reason: string;
};

export type SyncAlignmentResult = {
  referenceTrackSid: string | null;
  offsets: TrackAlignmentOffset[];
  warnings: string[];
};

export type SyncAlignmentWarningInput = {
  syncMarkerCount: number;
  completedTrackCount: number;
  distinctMarkerTrackCount?: number;
};

type TrackStats = {
  track: TrackAlignmentInput;
  markerCount: number;
  rtpMarkerCount: number;
  localOnlyMarkerCount: number;
};

const NO_MARKERS_REASON = "No sync markers available for alignment.";

export function chooseReferenceTrack(tracks: TrackAlignmentInput[]): string | null {
  const candidates = tracks.map(toTrackStats).filter((stats) => stats.markerCount > 0);
  if (candidates.length === 0) return null;

  const rtpCandidates = candidates.filter((stats) => stats.rtpMarkerCount >= 3);
  if (rtpCandidates.length > 0) {
    return sortByReferenceQuality(rtpCandidates, "rtpMarkerCount")[0]?.track.trackSid ?? null;
  }

  return sortByReferenceQuality(candidates, "localOnlyMarkerCount")[0]?.track.trackSid ?? null;
}

export function computeTrackAlignmentOffsets(tracks: TrackAlignmentInput[]): SyncAlignmentResult {
  const referenceTrackSid = chooseReferenceTrack(tracks);
  const warnings = buildAlignmentCoverageWarnings(tracks);

  if (!referenceTrackSid) {
    return {
      referenceTrackSid: null,
      offsets: tracks.map((track) => ({
        trackSid: track.trackSid,
        offsetMs: 0,
        confidence: "none",
        markerCount: track.markers.length,
        reason: NO_MARKERS_REASON,
      })),
      warnings,
    };
  }

  const referenceTrack = tracks.find((track) => track.trackSid === referenceTrackSid);
  if (!referenceTrack) {
    return {
      referenceTrackSid: null,
      offsets: tracks.map((track) => ({
        trackSid: track.trackSid,
        offsetMs: 0,
        confidence: "none",
        markerCount: track.markers.length,
        reason: "Reference track could not be resolved.",
      })),
      warnings: [...warnings, "Reference track could not be resolved."],
    };
  }

  const referenceRtpMarkers = sortedRtpMarkers(referenceTrack.markers);
  const referenceLocalBaseline = firstLocalTime(referenceTrack.markers);

  return {
    referenceTrackSid,
    offsets: tracks.map((track) =>
      computeTrackOffset(track, referenceTrack, referenceRtpMarkers, referenceLocalBaseline),
    ),
    warnings,
  };
}

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

function computeTrackOffset(
  track: TrackAlignmentInput,
  referenceTrack: TrackAlignmentInput,
  referenceRtpMarkers: SyncMarkerPoint[],
  referenceLocalBaseline: number | null,
): TrackAlignmentOffset {
  if (track.trackSid === referenceTrack.trackSid) {
    return {
      trackSid: track.trackSid,
      offsetMs: 0,
      confidence: track.markers.length === 0 ? "none" : "high",
      markerCount: track.markers.length,
      reason: "Reference track baseline.",
    };
  }

  if (track.markers.length === 0) {
    return {
      trackSid: track.trackSid,
      offsetMs: 0,
      confidence: "none",
      markerCount: 0,
      reason: NO_MARKERS_REASON,
    };
  }

  const rtpMarkers = sortedRtpMarkers(track.markers);
  if (referenceRtpMarkers.length >= 3 && rtpMarkers.length >= 3) {
    return {
      trackSid: track.trackSid,
      offsetMs: Math.round(averageLocalDelta(referenceRtpMarkers, rtpMarkers)),
      confidence: "high",
      markerCount: track.markers.length,
      reason: "Aligned from RTP-backed sync markers.",
    };
  }

  const localBaseline = firstLocalTime(track.markers);
  if (referenceLocalBaseline === null || localBaseline === null) {
    return {
      trackSid: track.trackSid,
      offsetMs: 0,
      confidence: "none",
      markerCount: track.markers.length,
      reason: NO_MARKERS_REASON,
    };
  }

  return {
    trackSid: track.trackSid,
    offsetMs: Math.round(localBaseline - referenceLocalBaseline),
    confidence: track.markers.length >= 3 ? "medium" : "low",
    markerCount: track.markers.length,
    reason:
      track.markers.length >= 3
        ? "Aligned from local sync marker baseline."
        : "Aligned from sparse local sync marker baseline.",
  };
}

function buildAlignmentCoverageWarnings(tracks: TrackAlignmentInput[]): string[] {
  const markerCount = tracks.reduce((total, track) => total + track.markers.length, 0);
  if (markerCount === 0 && tracks.length > 0) {
    return ["All tracks are missing sync coverage; alignment offsets default to 0ms."];
  }

  const uncoveredTracks = tracks.filter((track) => track.markers.length === 0);
  if (uncoveredTracks.length === 0) return [];

  return [
    `${uncoveredTracks.length} track(s) are missing sync coverage; those offsets default to 0ms.`,
  ];
}

function toTrackStats(track: TrackAlignmentInput): TrackStats {
  const rtpMarkerCount = track.markers.filter(hasRtpTimestamp).length;

  return {
    track,
    markerCount: track.markers.length,
    rtpMarkerCount,
    localOnlyMarkerCount: track.markers.length - rtpMarkerCount,
  };
}

function sortByReferenceQuality(
  stats: TrackStats[],
  primaryKey: "rtpMarkerCount" | "localOnlyMarkerCount",
): TrackStats[] {
  return [...stats].toSorted((a, b) => {
    const primaryDelta = b[primaryKey] - a[primaryKey];
    if (primaryDelta !== 0) return primaryDelta;

    const markerDelta = b.markerCount - a.markerCount;
    if (markerDelta !== 0) return markerDelta;

    return tracksFirstMarkerTime(a.track) - tracksFirstMarkerTime(b.track);
  });
}

function firstLocalTime(markers: SyncMarkerPoint[]): number | null {
  return sortedMarkers(markers)[0]?.localTime ?? null;
}

function tracksFirstMarkerTime(track: TrackAlignmentInput): number {
  return firstLocalTime(track.markers) ?? Number.POSITIVE_INFINITY;
}

function averageLocalDelta(
  referenceRtpMarkers: SyncMarkerPoint[],
  trackRtpMarkers: SyncMarkerPoint[],
): number {
  const sampleCount = Math.min(referenceRtpMarkers.length, trackRtpMarkers.length);
  if (sampleCount === 0) return 0;

  let totalDelta = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const referenceMarker = referenceRtpMarkers[index];
    const trackMarker = trackRtpMarkers[index];
    if (!referenceMarker || !trackMarker) continue;
    totalDelta += trackMarker.localTime - referenceMarker.localTime;
  }

  return totalDelta / sampleCount;
}

function sortedMarkers(markers: SyncMarkerPoint[]): SyncMarkerPoint[] {
  return [...markers].toSorted((a, b) => a.localTime - b.localTime);
}

function sortedRtpMarkers(markers: SyncMarkerPoint[]): SyncMarkerPoint[] {
  return markers.filter(hasRtpTimestamp).toSorted((a, b) => {
    const rtpDelta = Number(a.rtpTimestamp) - Number(b.rtpTimestamp);
    if (rtpDelta !== 0) return rtpDelta;
    return a.localTime - b.localTime;
  });
}

function hasRtpTimestamp(marker: SyncMarkerPoint): boolean {
  return marker.rtpTimestamp !== null && marker.rtpTimestamp !== undefined;
}
