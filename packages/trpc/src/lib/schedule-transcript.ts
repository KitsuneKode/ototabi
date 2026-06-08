import { transcriptJobId } from "@ototabi/common/pipeline-status";
import { getTranscriptQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

import { recordingsRepository } from "../modules/recordings/recordings.repository";
import { usageService } from "../modules/usage/usage.service";
import { resetAiPipelineForRetry } from "./ai-pipeline-reset";
import {
  evaluateScheduleTranscript,
  type ScheduleTranscriptResult,
} from "./schedule-transcript.gates";

export type { ScheduleTranscriptResult };

/** Queue Whisper when session is complete and mic media exists. */
export async function scheduleTranscriptForSession(
  sessionId: string,
  options?: { force?: boolean },
): Promise<ScheduleTranscriptResult> {
  const session = await prisma.recordingSession.findUnique({
    where: { id: sessionId },
    select: { status: true, transcriptStatus: true },
  });

  const hasSegments = !!(await prisma.transcriptSegment.findFirst({
    where: { sessionId },
    select: { id: true },
  }));

  const audioTrack = await recordingsRepository.findFirstAudioTrack(sessionId);

  const gate = evaluateScheduleTranscript({
    sessionStatus: session?.status,
    transcriptStatus: session?.transcriptStatus ?? "pending",
    hasSegments,
    hasAudioKey: !!audioTrack?.s3Key,
    force: options?.force,
  });
  if (gate.status !== "queued") {
    return gate;
  }

  const hostUserId = await recordingsRepository.findSessionHostUserId(sessionId);
  if (hostUserId) {
    const planGate = await usageService.evaluateTranscriptScheduleForHost(hostUserId);
    if (planGate === "plan_upgrade_required") {
      return { status: "plan_upgrade_required" };
    }
  }

  if (!audioTrack?.s3Key) {
    return { status: "waiting_for_upload" };
  }

  if (options?.force) {
    await resetAiPipelineForRetry(sessionId);
  }

  const queue = getTranscriptQueue();
  const jobId = transcriptJobId(sessionId);
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: { transcriptStatus: "processing", transcriptError: null },
  });

  await queue.add(jobId, { sessionId, audioTrackS3Key: audioTrack.s3Key }, { jobId });

  return { status: "queued" };
}
