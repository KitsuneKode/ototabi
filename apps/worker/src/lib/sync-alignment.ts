import { computeTrackAlignmentOffsets } from "@ototabi/common/sync-alignment";
import { prisma } from "@ototabi/store";

export async function resolveTrackOffsetMs(sessionId: string, trackSid: string): Promise<number> {
  const [markers, tracks] = await Promise.all([
    prisma.syncMarker.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.recordingTrack.findMany({
      where: { sessionId, status: "COMPLETED" },
      select: { trackSid: true },
    }),
  ]);

  const completedTrackSids = tracks.map((track) => track.trackSid);
  const result = computeTrackAlignmentOffsets(
    completedTrackSids.map((sid) => ({
      trackSid: sid,
      markers: markers
        .filter((marker) => marker.trackSid === sid)
        .map((marker) => ({
          id: marker.id,
          localTime: marker.localTime,
          trackSid: marker.trackSid,
          rtpTimestamp: marker.rtpTimestamp,
          createdAt: marker.createdAt,
        })),
    })),
  );

  return result.offsets.find((offset) => offset.trackSid === trackSid)?.offsetMs ?? 0;
}
