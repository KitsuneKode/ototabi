import { prisma } from "@ototabi/store";

/** Remove downstream AI artifacts and reset pipeline status columns for a forced re-transcribe. */
export async function resetAiPipelineForRetry(sessionId: string): Promise<void> {
  await prisma.$transaction([
    prisma.transcriptSegment.deleteMany({ where: { sessionId } }),
    prisma.chapter.deleteMany({ where: { sessionId } }),
    prisma.showNotes.deleteMany({ where: { sessionId } }),
    prisma.clipCandidate.deleteMany({ where: { sessionId } }),
    prisma.recordingSession.update({
      where: { id: sessionId },
      data: {
        transcriptStatus: "pending",
        transcriptError: null,
        llmStatus: "pending",
        llmError: null,
        clipsStatus: "pending",
        clipsError: null,
      },
    }),
  ]);
}
