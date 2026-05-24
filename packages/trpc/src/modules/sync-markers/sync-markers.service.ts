import { TRPCError } from "@trpc/server";

import { syncMarkersRepository } from "./sync-markers.repository";

export const syncMarkersService = {
  async submit(params: {
    actorId: string;
    sessionId: string;
    localTime: number;
    rtpTimestamp?: number;
    trackSid?: string;
  }) {
    const canAccess = await syncMarkersRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this session" });
    }
    return syncMarkersRepository.create({
      sessionId: params.sessionId,
      userId: params.actorId,
      localTime: params.localTime,
      rtpTimestamp: params.rtpTimestamp,
      trackSid: params.trackSid,
    });
  },

  async list(params: { actorId: string; sessionId: string }) {
    const canAccess = await syncMarkersRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this session" });
    }
    return syncMarkersRepository.listBySession(params.sessionId);
  },
};
