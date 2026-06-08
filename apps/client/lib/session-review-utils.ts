import type { UploadDisplayStatus } from "@/components/patterns/upload-status-utils";

import { mergeSessionTimelineEvents } from "@/lib/merge-session-timeline";

type TrackStatus = { status: string };

function deriveAllUploaded(tracks: TrackStatus[]): boolean {
  return tracks.length > 0 && tracks.every((t) => t.status === "COMPLETED");
}

function deriveAggregateUploadStatus(tracks: TrackStatus[]): UploadDisplayStatus {
  if (tracks.length === 0) return "recording";
  if (deriveAllUploaded(tracks)) return "complete";
  if (tracks.some((t) => t.status === "UPLOADING")) return "uploading";
  return "recoverable";
}

type SessionReviewPayload = {
  events?: Parameters<typeof mergeSessionTimelineEvents>[0];
  syncMarkers?: Parameters<typeof mergeSessionTimelineEvents>[1];
  session?: { tracks: TrackStatus[] };
};

export function deriveSessionReviewView(data: SessionReviewPayload | undefined) {
  const tracks = data?.session?.tracks ?? [];
  return {
    timelineEvents: mergeSessionTimelineEvents(data?.events, data?.syncMarkers),
    allUploaded: deriveAllUploaded(tracks),
    aggregateUploadStatus: deriveAggregateUploadStatus(tracks),
  };
}
