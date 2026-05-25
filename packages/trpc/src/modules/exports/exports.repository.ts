import { prisma } from "@ototabi/store";

const sessionInclude = {
  room: { select: { id: true, name: true, code: true } },
  tracks: {
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export const exportsRepository = {
  async findSessionForActor(sessionId: string, actorId: string) {
    return prisma.recordingSession.findFirst({
      where: {
        id: sessionId,
        room: {
          OR: [
            { creatorId: actorId },
            { members: { some: { userId: actorId } } },
            { participants: { some: { userId: actorId } } },
          ],
        },
      },
      include: sessionInclude,
    });
  },

  async loadExportContext(sessionId: string) {
    const [transcriptSegments, clipCandidates, exportFields] = await Promise.all([
      prisma.transcriptSegment.findMany({
        where: { sessionId },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          text: true,
          confidence: true,
        },
      }),
      prisma.clipCandidate.findMany({
        where: { sessionId },
        orderBy: { score: "desc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          score: true,
          renderStatus: true,
          renderS3Key: true,
          renderError: true,
        },
      }),
      prisma.recordingSession.findUnique({
        where: { id: sessionId },
        select: {
          episodeMp3Status: true,
          episodeMp3S3Key: true,
          episodeMp3Error: true,
          landscapeStatus: true,
          landscapeS3Key: true,
          landscapeError: true,
        },
      }),
    ]);

    return { transcriptSegments, clipCandidates, exportFields };
  },
};
