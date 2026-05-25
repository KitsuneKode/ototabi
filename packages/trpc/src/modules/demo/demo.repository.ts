import { prisma } from "@ototabi/store";

const DEMO_ROOM_NAME = "Product Demos";

function demoRoomCode(userId: string): string {
  return `demo-${userId.slice(-16)}`;
}

export const demoRepository = {
  async getOrCreateDemoRoom(creatorId: string) {
    const code = demoRoomCode(creatorId);
    const existing = await prisma.room.findUnique({ where: { code } });
    if (existing) return existing;

    return prisma.room.create({
      data: {
        name: DEMO_ROOM_NAME,
        code,
        creatorId,
      },
    });
  },

  async createDemoSession(roomId: string) {
    return prisma.recordingSession.create({
      data: {
        roomId,
        status: "RECORDING",
        mode: "DEMO",
        startedAt: new Date(),
        demoData: {
          create: {},
        },
      },
      include: { demoData: true },
    });
  },

  async findDemoSessionForActor(sessionId: string, actorId: string) {
    return prisma.recordingSession.findFirst({
      where: {
        id: sessionId,
        mode: "DEMO",
        room: { creatorId: actorId },
      },
      include: {
        demoData: true,
        tracks: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        room: { select: { id: true, name: true, code: true, creatorId: true } },
      },
    });
  },

  async endActiveDemoSessions(roomId: string) {
    return prisma.recordingSession.updateMany({
      where: { roomId, mode: "DEMO", status: "RECORDING" },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async markDemoSessionComplete(sessionId: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async saveCursorEvents(sessionId: string, cursorEvents: unknown) {
    return prisma.demoSessionData.update({
      where: { sessionId },
      data: { cursorEvents: cursorEvents as object },
    });
  },

  async saveDemoEdit(
    sessionId: string,
    data: {
      zoomRegions: unknown;
      trimStartMs?: number | null;
      trimEndMs?: number | null;
      background?: unknown;
    },
  ) {
    return prisma.demoSessionData.update({
      where: { sessionId },
      data: {
        zoomRegions: data.zoomRegions as object,
        ...(data.trimStartMs !== undefined ? { trimStartMs: data.trimStartMs } : {}),
        ...(data.trimEndMs !== undefined ? { trimEndMs: data.trimEndMs } : {}),
        ...(data.background !== undefined ? { background: data.background as object } : {}),
      },
    });
  },
};
