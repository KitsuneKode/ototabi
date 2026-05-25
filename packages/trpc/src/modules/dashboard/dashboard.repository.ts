import { prisma } from "@ototabi/store";

export const dashboardRepository = {
  async getSummaryForHost(userId: string) {
    const [ownedRooms, sharedRooms, recentSessions] = await Promise.all([
      prisma.room.findMany({
        where: { creatorId: userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { sessions: true, participants: true } },
        },
      }),
      prisma.room.findMany({
        where: { members: { some: { userId } } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { sessions: true, participants: true } },
        },
      }),
      prisma.recordingSession.findMany({
        where: { room: { creatorId: userId } },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          startedAt: true,
          endedAt: true,
          room: { select: { id: true, name: true, code: true } },
          tracks: { select: { id: true, status: true, type: true } },
          _count: {
            select: {
              transcriptSegments: true,
              chapters: true,
              clipCandidates: true,
            },
          },
          showNotes: { select: { id: true } },
        },
      }),
    ]);

    return { ownedRooms, sharedRooms, recentSessions };
  },
};
