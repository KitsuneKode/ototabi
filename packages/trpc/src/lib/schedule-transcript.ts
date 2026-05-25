import { getTranscriptQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

import { roomsRepository } from "../modules/rooms/rooms.repository";

export type ScheduleTranscriptResult =
  | { status: "queued" }
  | { status: "already_ready" }
  | { status: "waiting_for_upload" }
  | { status: "session_not_complete" };

/** Queue Whisper when session is complete and mic media exists. */
export async function scheduleTranscriptForSession(
  sessionId: string,
  options?: { force?: boolean },
): Promise<ScheduleTranscriptResult> {
  const existing = await prisma.transcriptSegment.findFirst({
    where: { sessionId },
    select: { id: true },
  });
  if (existing && !options?.force) {
    return { status: "already_ready" };
  }

  const session = await prisma.recordingSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (session?.status !== "COMPLETED") {
    return { status: "session_not_complete" };
  }

  const audioTrack = await roomsRepository.findFirstAudioTrack(sessionId);
  if (!audioTrack?.s3Key) {
    return { status: "waiting_for_upload" };
  }

  if (options?.force) {
    await prisma.transcriptSegment.deleteMany({ where: { sessionId } });
  }

  const queue = getTranscriptQueue();
  const jobId = `transcript-${sessionId}`;
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  await queue.add(jobId, { sessionId, audioTrackS3Key: audioTrack.s3Key }, { jobId });

  return { status: "queued" };
}
