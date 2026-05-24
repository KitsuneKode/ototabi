import { prisma } from "@ototabi/store";

export const syncMarkersRepository = {
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

  async create(data: {
    sessionId: string;
    userId: string;
    localTime: number;
    rtpTimestamp?: number;
    trackSid?: string;
  }) {
    return prisma.syncMarker.create({ data });
  },

  async listBySession(sessionId: string) {
    return prisma.syncMarker.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  },
};
