import type { Prisma } from "@ototabi/store";

import { prisma } from "@ototabi/store";

import type { RecordingEventType } from "./recording-events.dto";

export const recordingEventsRepository = {
  async create(data: {
    sessionId: string;
    userId?: string;
    type: RecordingEventType;
    trackSid?: string;
    message?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.recordingEvent.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        type: data.type,
        trackSid: data.trackSid,
        message: data.message,
        metadata: data.metadata ?? {},
      },
    });
  },

  async listBySession(sessionId: string) {
    return prisma.recordingEvent.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { occurredAt: "asc" },
    });
  },

  async canUserAccessSession(sessionId: string, userId: string) {
    const session = await prisma.recordingSession.findFirst({
      where: {
        id: sessionId,
        room: {
          OR: [
            { creatorId: userId },
            { members: { some: { userId } } },
            { participants: { some: { userId } } },
          ],
        },
      },
      select: { id: true },
    });
    return !!session;
  },
};
