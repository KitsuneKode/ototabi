import { prisma } from "@ototabi/store";

export const transcriptRepository = {
  async getSegments(sessionId: string) {
    return prisma.transcriptSegment.findMany({
      where: { sessionId },
      orderBy: { startTime: "asc" },
    });
  },

  async getChapters(sessionId: string) {
    return prisma.chapter.findMany({
      where: { sessionId },
      orderBy: { startTime: "asc" },
    });
  },

  async getShowNotes(sessionId: string) {
    return prisma.showNotes.findUnique({
      where: { sessionId },
    });
  },
};
