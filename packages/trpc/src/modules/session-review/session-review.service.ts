import type { ExportPreset } from "@ototabi/jobs/types";

import { getExportQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import { scheduleLlmRegenForSession } from "../../lib/schedule-llm-regen";
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

    const [bundle, exportFields, pipeline] = await Promise.all([
      sessionReviewRepository.loadReviewBundle(params.sessionId),
      sessionReviewRepository.getSessionExportFields(params.sessionId),
      sessionReviewRepository.getSessionPipelineFields(params.sessionId),
    ]);
    return mapSessionReview(session, bundle, exportFields, pipeline);
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

  async regenerateLlm(params: { actorId: string; sessionId: string }) {
    await assertCanViewSession(params.actorId, params.sessionId);
    const result = await scheduleLlmRegenForSession(params.sessionId);
    if (result.status === "blocked") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: result.message });
    }
    return { status: "queued" as const };
  },

  async updateShowNotesSummary(params: { actorId: string; sessionId: string; summary: string }) {
    await assertCanViewSession(params.actorId, params.sessionId);
    const existing = await prisma.showNotes.findUnique({
      where: { sessionId: params.sessionId },
      select: { id: true },
    });
    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Show notes not found — generate AI artifacts first",
      });
    }
    await prisma.showNotes.update({
      where: { sessionId: params.sessionId },
      data: { summary: params.summary },
    });
    return { ok: true as const };
  },
};
