import type { ExportPreset } from "@ototabi/jobs/types";

import {
  exportSessionJobId,
  resolveSessionDurationSec,
  resolveSessionExportRoute,
  shouldPreferWorkerExport,
  type SessionExportMetrics,
} from "@ototabi/common/export-routing";
import { getExportQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import { scheduleTranscriptForSession } from "../../lib/schedule-transcript";
import { mapSessionReview } from "./session-review.mapper";
import { sessionReviewPolicy } from "./session-review.policy";
import { sessionReviewRepository } from "./session-review.repository";

function sessionExportMetrics(session: {
  startedAt: Date;
  endedAt: Date | null;
  tracks: Array<{ status: string }>;
}): SessionExportMetrics {
  return {
    durationSec: resolveSessionDurationSec({
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      fallbackSec: 120,
    }),
    completedTrackCount: session.tracks.filter((t) => t.status === "COMPLETED").length,
  };
}

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
    const metrics = sessionExportMetrics(session);
    return mapSessionReview(session, bundle, exportFields, pipeline, {
      route: resolveSessionExportRoute(metrics),
      metrics,
    });
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
    force?: boolean;
  }) {
    const session = await assertCanViewSession(params.actorId, params.sessionId);

    const statusField = params.preset === "episode_mp3" ? "episodeMp3Status" : "landscapeStatus";
    const errorField = params.preset === "episode_mp3" ? "episodeMp3Error" : "landscapeError";
    const exportRow = await sessionReviewRepository.getSessionExportFields(params.sessionId);
    const currentStatus =
      params.preset === "episode_mp3" ? exportRow?.episodeMp3Status : exportRow?.landscapeStatus;
    const existingKey =
      params.preset === "episode_mp3" ? exportRow?.episodeMp3S3Key : exportRow?.landscapeS3Key;

    if (!params.force && currentStatus === "ready" && existingKey) {
      return {
        status: "ready" as const,
        outputKey: existingKey,
        route: "worker" as const,
        jobId: exportSessionJobId(params.sessionId, params.preset),
      };
    }

    const metrics = sessionExportMetrics(session);
    const route = resolveSessionExportRoute(metrics);
    const preferWorker = shouldPreferWorkerExport(metrics);
    const jobId = exportSessionJobId(params.sessionId, params.preset);

    await prisma.recordingSession.update({
      where: { id: params.sessionId },
      data: {
        [statusField]: "processing",
        [errorField]: null,
      },
    });

    await getExportQueue().add(
      jobId,
      {
        sessionId: params.sessionId,
        preset: params.preset satisfies ExportPreset,
        preferWorker,
        force: params.force,
      },
      { jobId },
    );

    return {
      status: "processing" as const,
      route,
      jobId,
      preferWorker,
    };
  },
};
