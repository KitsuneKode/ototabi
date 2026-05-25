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

export const sessionReviewRepository = {
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

  async loadReviewBundle(sessionId: string) {
    const [events, syncMarkers, transcriptSegments, chapters, showNotes, clipCandidates] =
      await Promise.all([
        prisma.recordingEvent.findMany({
          where: { sessionId },
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { occurredAt: "asc" },
        }),
        prisma.syncMarker.findMany({
          where: { sessionId },
          orderBy: { createdAt: "asc" },
        }),
        prisma.transcriptSegment.findMany({
          where: { sessionId },
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            sessionId: true,
            startTime: true,
            endTime: true,
            text: true,
            confidence: true,
          },
        }),
        prisma.chapter.findMany({
          where: { sessionId },
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            sessionId: true,
            startTime: true,
            endTime: true,
            title: true,
          },
        }),
        prisma.showNotes.findUnique({
          where: { sessionId },
          select: {
            id: true,
            summary: true,
            keywords: true,
            seoTitles: true,
            createdAt: true,
          },
        }),
        prisma.clipCandidate.findMany({
          where: { sessionId },
          orderBy: { score: "desc" },
          take: 10,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            score: true,
            rationale: true,
            layout: true,
            renderStatus: true,
            renderS3Key: true,
            renderError: true,
          },
        }),
      ]);

    return { events, syncMarkers, transcriptSegments, chapters, showNotes, clipCandidates };
  },

  async getSessionExportFields(sessionId: string) {
    return prisma.recordingSession.findUnique({
      where: { id: sessionId },
      select: {
        episodeMp3Status: true,
        episodeMp3S3Key: true,
        episodeMp3Error: true,
        landscapeStatus: true,
        landscapeS3Key: true,
        landscapeError: true,
      },
    });
  },
};
