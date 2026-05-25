import { llmJobId } from "@ototabi/common/pipeline-status";
import { getLlmQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

import {
  evaluateRegenerateLlm,
  regenBlockMessage,
} from "../modules/session-review/ai-regen.policy";
import { resetLlmArtifactsForRegen } from "./ai-pipeline-reset";

export type ScheduleLlmRegenResult = { status: "queued" } | { status: "blocked"; message: string };

/** Delete chapters/show notes and re-queue the LLM worker job. */
export async function scheduleLlmRegenForSession(
  sessionId: string,
): Promise<ScheduleLlmRegenResult> {
  const session = await prisma.recordingSession.findUnique({
    where: { id: sessionId },
    select: {
      status: true,
      transcriptStatus: true,
      llmStatus: true,
    },
  });

  if (!session) {
    return { status: "blocked", message: "Session not found" };
  }

  const hasSegments = !!(await prisma.transcriptSegment.findFirst({
    where: { sessionId },
    select: { id: true },
  }));

  const gate = evaluateRegenerateLlm({
    sessionStatus: session.status,
    transcriptDbStatus: session.transcriptStatus,
    llmDbStatus: session.llmStatus,
    hasTranscriptSegments: hasSegments,
  });

  if (!gate.allowed) {
    return { status: "blocked", message: regenBlockMessage(gate.reason) };
  }

  await resetLlmArtifactsForRegen(sessionId);

  const queue = getLlmQueue();
  const jobId = llmJobId(sessionId);
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    await existingJob.remove();
  }

  await queue.add(jobId, { sessionId }, { jobId });

  return { status: "queued" };
}
