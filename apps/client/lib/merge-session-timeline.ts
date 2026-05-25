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
