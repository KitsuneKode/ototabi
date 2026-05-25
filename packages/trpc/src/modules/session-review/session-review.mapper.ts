import type { sessionReviewRepository } from "./session-review.repository";

type SessionRecord = NonNullable<
  Awaited<ReturnType<typeof sessionReviewRepository.findSessionForActor>>
>;

type BundleRecord = Awaited<ReturnType<typeof sessionReviewRepository.loadReviewBundle>>;

export function mapSessionReview(session: SessionRecord, bundle: BundleRecord) {
  return {
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      room: session.room,
      tracks: session.tracks.map((track) => ({
        id: track.id,
        trackSid: track.trackSid,
        type: track.type,
        status: track.status,
        s3Key: track.s3Key,
        s3Url: track.s3Url,
        user: track.user,
      })),
    },
    events: bundle.events.map((event) => ({
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt,
      trackSid: event.trackSid,
      message: event.message,
      user: event.user ? { name: event.user.name } : null,
    })),
    syncMarkers: bundle.syncMarkers.map((marker) => ({
      id: marker.id,
      localTime: marker.localTime,
      createdAt: marker.createdAt,
      trackSid: marker.trackSid,
    })),
    transcriptSegments: bundle.transcriptSegments,
    chapters: bundle.chapters,
  };
}
