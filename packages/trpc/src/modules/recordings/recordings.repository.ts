import { prisma } from "@ototabi/store";

export const recordingsRepository = {
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

  async endActiveSessions(roomId: string) {
    return prisma.recordingSession.updateMany({
      where: { roomId, status: "RECORDING" },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async createSession(roomId: string) {
    return prisma.recordingSession.create({
      data: { roomId, status: "RECORDING", startedAt: new Date() },
    });
  },

  async findSession(sessionId: string) {
    return prisma.recordingSession.findUnique({ where: { id: sessionId } });
  },

  async findSessionHostUserId(sessionId: string): Promise<string | null> {
    const row = await prisma.recordingSession.findUnique({
      where: { id: sessionId },
      select: { room: { select: { creatorId: true } } },
    });
    return row?.room.creatorId ?? null;
  },

  async findActiveSessionByRoom(roomId: string) {
    return prisma.recordingSession.findFirst({
      where: { roomId, status: "RECORDING" },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
  },

  async markSessionComplete(sessionId: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async findFirstAudioTrack(sessionId: string) {
    return prisma.recordingTrack.findFirst({
      where: {
        sessionId,
        type: "MICROPHONE",
        status: "COMPLETED",
        OR: [{ s3Key: { not: "" } }, { s3Url: { not: null } }],
      },
      select: { s3Key: true, s3Url: true },
    });
  },

  async listSessions(roomId: string, take = 50) {
    return prisma.recordingSession.findMany({
      where: { roomId },
      orderBy: { startedAt: "desc" },
      take,
      include: {
        tracks: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async getSessionWithDetails(sessionId: string) {
    return prisma.recordingSession.findUnique({
      where: { id: sessionId },
      include: {
        room: { select: { id: true, name: true, code: true } },
        tracks: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async listRecentByCreator(userId: string, take = 10) {
    return prisma.recordingSession.findMany({
      where: { room: { creatorId: userId } },
      orderBy: { startedAt: "desc" },
      take,
      include: {
        room: { select: { id: true, name: true, code: true } },
        tracks: { select: { id: true, status: true, type: true } },
      },
    });
  },
};
