import type { ExportPreset } from "@ototabi/jobs/types";

import { getExportQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import { scheduleTranscriptForSession } from "../../lib/schedule-transcript";
import { mapSessionReview } from "./session-review.mapper";
import { sessionReviewPolicy } from "./session-review.policy";
import { sessionReviewRepository } from "./session-review.repository";

async function assertCanViewSession(actorId: string, sessionId: string) {
  const session = await sessionReviewRepository.findSessionForActor(sessionId, actorId);
  if (!sessionReviewPolicy.canViewSession(session)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
  }
  return session;
}

export const sessionReviewService = {
  async getSessionReview(params: { actorId: string; sessionId: string }) {
    const session = await assertCanViewSession(params.actorId, params.sessionId);

    const [bundle, exportFields] = await Promise.all([
      sessionReviewRepository.loadReviewBundle(params.sessionId),
      sessionReviewRepository.getSessionExportFields(params.sessionId),
    ]);
    return mapSessionReview(session, bundle, exportFields);
  },

  async retryTranscript(params: { actorId: string; sessionId: string }) {
    await assertCanViewSession(params.actorId, params.sessionId);
    try {
      return await scheduleTranscriptForSession(params.sessionId, { force: true });
    } catch (error) {
      console.warn("[SessionReview] Failed to queue transcript:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not queue transcript job",
      });
    }
  },

  async queueSessionExport(params: {
    actorId: string;
    sessionId: string;
    preset: "landscape_16_9" | "episode_mp3";
  }) {
    await assertCanViewSession(params.actorId, params.sessionId);

    const statusField = params.preset === "episode_mp3" ? "episodeMp3Status" : "landscapeStatus";
    const errorField = params.preset === "episode_mp3" ? "episodeMp3Error" : "landscapeError";

    await prisma.recordingSession.update({
      where: { id: params.sessionId },
      data: {
        [statusField]: "processing",
        [errorField]: null,
      },
    });

    await getExportQueue().add(`export-session-${params.sessionId}-${params.preset}`, {
      sessionId: params.sessionId,
      preset: params.preset satisfies ExportPreset,
    });

    return { status: "processing" as const };
  },
};
