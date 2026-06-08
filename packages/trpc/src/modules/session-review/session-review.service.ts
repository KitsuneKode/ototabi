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

import { scheduleLlmRegenForSession } from "../../lib/schedule-llm-regen";
import { scheduleTranscriptForSession } from "../../lib/schedule-transcript";
import { mapAiUiStatus, mapSessionReview, mapTranscriptUiStatus } from "./session-review.mapper";
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

    const [bundle, statusFields] = await Promise.all([
      sessionReviewRepository.loadReviewBundle(params.sessionId),
      sessionReviewRepository.getSessionStatusFields(params.sessionId),
    ]);
    const exportFields = statusFields
      ? {
          episodeMp3Status: statusFields.episodeMp3Status,
          episodeMp3S3Key: statusFields.episodeMp3S3Key,
          episodeMp3Error: statusFields.episodeMp3Error,
          landscapeStatus: statusFields.landscapeStatus,
          landscapeS3Key: statusFields.landscapeS3Key,
          landscapeError: statusFields.landscapeError,
        }
      : null;
    const pipeline = statusFields
      ? {
          transcriptStatus: statusFields.transcriptStatus,
          transcriptError: statusFields.transcriptError,
          llmStatus: statusFields.llmStatus,
          llmError: statusFields.llmError,
          clipsStatus: statusFields.clipsStatus,
          clipsError: statusFields.clipsError,
        }
      : null;
    const metrics = sessionExportMetrics(session);
    return mapSessionReview(session, bundle, exportFields, pipeline, {
      route: resolveSessionExportRoute(metrics),
      metrics,
    });
  },

  async getSessionStatus(params: { actorId: string; sessionId: string }) {
    const session = await assertCanViewSession(params.actorId, params.sessionId);
    const statusFields = await sessionReviewRepository.getSessionStatusFields(params.sessionId);
    if (!statusFields) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    }

    const micReady = session.tracks.some(
      (t) =>
        t.type === "MICROPHONE" &&
        t.status === "COMPLETED" &&
        (t.s3Key.length > 0 || t.s3Url != null),
    );

    const transcriptCount = await prisma.transcriptSegment.count({
      where: { sessionId: params.sessionId },
    });
    const hasTranscript = transcriptCount > 0;

    const pipeline = {
      transcriptStatus: statusFields.transcriptStatus,
      transcriptError: statusFields.transcriptError,
      llmStatus: statusFields.llmStatus,
      llmError: statusFields.llmError,
      clipsStatus: statusFields.clipsStatus,
      clipsError: statusFields.clipsError,
    };

    const exports = {
      episodeMp3: {
        status: statusFields.episodeMp3Status,
        s3Key: statusFields.episodeMp3S3Key,
        error: statusFields.episodeMp3Error,
      },
      landscape: {
        status: statusFields.landscapeStatus,
        s3Key: statusFields.landscapeS3Key,
        error: statusFields.landscapeError,
      },
    };

    const clipRenderStatuses = statusFields.clipCandidates.map((clip) => ({
      id: clip.id,
      renderStatus: clip.renderStatus,
    }));

    const [showNotesCount, chapterCount] = await Promise.all([
      prisma.showNotes.count({ where: { sessionId: params.sessionId } }),
      prisma.chapter.count({ where: { sessionId: params.sessionId } }),
    ]);
    const hasAiArtifacts =
      showNotesCount > 0 || chapterCount > 0 || statusFields.clipCandidates.length > 0;

    return {
      sessionStatus: session.status,
      aiStatus: mapAiUiStatus({
        sessionStatus: session.status,
        transcriptDbStatus: pipeline.transcriptStatus,
        llmDbStatus: pipeline.llmStatus,
        clipsDbStatus: pipeline.clipsStatus,
        hasTranscript,
        hasAiArtifacts,
      }),
      transcriptStatus: mapTranscriptUiStatus({
        sessionStatus: session.status,
        dbStatus: pipeline.transcriptStatus,
        hasSegments: hasTranscript,
        micReady,
      }),
      exports,
      pipeline,
      clipRenderStatuses,
    };
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

    const jobId = exportSessionJobId(params.sessionId, params.preset);

    if (!params.force && currentStatus === "ready" && existingKey) {
      return {
        status: "ready" as const,
        outputKey: existingKey,
        route: "worker" as const,
        jobId,
      };
    }

    const metrics = sessionExportMetrics(session);
    const route = resolveSessionExportRoute(metrics);
    const preferWorker = shouldPreferWorkerExport(metrics);

    if (!params.force && currentStatus === "processing") {
      const existingJob = await getExportQueue().getJob(jobId);
      if (existingJob && !["completed", "failed"].includes(await existingJob.getState())) {
        return {
          status: "processing" as const,
          route,
          jobId,
          preferWorker,
        };
      }
    }

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
