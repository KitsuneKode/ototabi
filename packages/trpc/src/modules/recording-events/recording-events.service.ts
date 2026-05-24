import type { Prisma } from "@ototabi/store";

import { TRPCError } from "@trpc/server";

import type { RecordingEventType } from "./recording-events.dto";

import { recordingEventsRepository } from "./recording-events.repository";

export const recordingEventsService = {
  async createEvent(params: {
    actorId?: string;
    sessionId: string;
    type: RecordingEventType;
    trackSid?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (params.actorId) {
      const canAccess = await recordingEventsRepository.canUserAccessSession(
        params.sessionId,
        params.actorId,
      );
      if (!canAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this session" });
      }
    }

    return recordingEventsRepository.create({
      sessionId: params.sessionId,
      userId: params.actorId,
      type: params.type,
      trackSid: params.trackSid,
      message: params.message,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    });
  },

  async listEvents(params: { actorId: string; sessionId: string }) {
    const canAccess = await recordingEventsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this session" });
    }
    return recordingEventsRepository.listBySession(params.sessionId);
  },
};
