import { Track, type LocalTrack, type Room } from "livekit-client";

export type PublishSyncMarkerInput = {
  sessionId: string;
  localTime: number;
  trackSid?: string;
  rtpTimestamp?: number;
};

export type SyncMarkerSubmitter = (input: PublishSyncMarkerInput) => void;

export type SyncMarkerDataPublisher = (payload: Uint8Array) => Promise<void>;

export function encodeSyncMarkerPayload(input: PublishSyncMarkerInput): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      type: "sync_marker",
      sessionId: input.sessionId,
      localTime: input.localTime,
      ...(input.trackSid ? { trackSid: input.trackSid } : {}),
      ...(input.rtpTimestamp !== undefined ? { rtpTimestamp: input.rtpTimestamp } : {}),
    }),
  );
}

/** Resolves the local microphone track SID when published. */
export function resolvePrimaryMicTrackSid(room: Room): string | undefined {
  const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  return publication?.trackSid ?? undefined;
}

/** Best-effort RTP timestamp from the local mic sender stats. */
export async function resolveRtpTimestamp(room: Room): Promise<number | undefined> {
  const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  const track = publication?.track as LocalTrack | undefined;
  if (!track?.mediaStreamTrack) return undefined;

  const sender = (track as LocalTrack & { sender?: RTCRtpSender }).sender;
  if (!sender) return undefined;

  try {
    const report = await sender.getStats();
    for (const stat of report.values()) {
      if (stat.type === "outbound-rtp" && typeof stat.timestamp === "number") {
        return stat.timestamp;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function buildSyncMarkerInput(
  room: Room,
  sessionId: string,
): Promise<PublishSyncMarkerInput> {
  const localTime = performance.now();
  const trackSid = resolvePrimaryMicTrackSid(room);
  const rtpTimestamp = await resolveRtpTimestamp(room);

  return {
    sessionId,
    localTime,
    ...(trackSid ? { trackSid } : {}),
    ...(rtpTimestamp !== undefined ? { rtpTimestamp } : {}),
  };
}

export async function publishSyncMarker(params: {
  room: Room;
  sessionId: string;
  submit: SyncMarkerSubmitter;
  publishData: SyncMarkerDataPublisher;
}): Promise<void> {
  const input = await buildSyncMarkerInput(params.room, params.sessionId);
  params.submit(input);
  await params.publishData(encodeSyncMarkerPayload(input));
}
