import { assertReelsPresetId, listReelsPresets } from "@ototabi/common/reels-presets";
import { getClipsQueue, getExportQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import { recordingsRepository } from "../recordings/recordings.repository";
import { usageService } from "../usage/usage.service";

export const clipsService = {
  async listForSession(params: { actorId: string; sessionId: string }) {
    const canAccess = await recordingsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view clips" });
    }
    return prisma.clipCandidate.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { score: "desc" },
    });
  },

  async queueClipRender(params: { actorId: string; sessionId: string; clipId: string }) {
    const canAccess = await recordingsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }
    const clip = await prisma.clipCandidate.findFirst({
      where: { id: params.clipId, sessionId: params.sessionId },
    });
    if (!clip) throw new TRPCError({ code: "NOT_FOUND", message: "Clip not found" });

    await usageService.assertCanUseClipOperation(params.actorId);
    await usageService.recordClipOperation(params.actorId);

    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "processing", renderError: null },
    });

    await getExportQueue().add(`export-clip-${clip.id}`, {
      sessionId: params.sessionId,
      clipId: clip.id,
      preset: "vertical_9_16",
    });

    return { status: "processing" as const };
  },

  listReelsPresets() {
    return listReelsPresets();
  },

  async queueReelsRender(params: {
    actorId: string;
    sessionId: string;
    clipId: string;
    reelsPresetId: string;
  }) {
    try {
      assertReelsPresetId(params.reelsPresetId);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown reels preset" });
    }

    const canAccess = await recordingsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }

    const clip = await prisma.clipCandidate.findFirst({
      where: { id: params.clipId, sessionId: params.sessionId },
    });
    if (!clip) throw new TRPCError({ code: "NOT_FOUND", message: "Clip not found" });

    await usageService.assertCanUseClipOperation(params.actorId);
    await usageService.recordClipOperation(params.actorId);

    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "processing", renderError: null },
    });

    await getExportQueue().add(`export-reels-${clip.id}-${params.reelsPresetId}`, {
      sessionId: params.sessionId,
      clipId: clip.id,
      preset: "vertical_9_16",
      reelsPresetId: params.reelsPresetId,
    });

    return { status: "processing" as const, reelsPresetId: params.reelsPresetId };
  },

  async regenerateClips(params: { actorId: string; sessionId: string }) {
    const canAccess = await recordingsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }
    await usageService.assertCanUseClipOperation(params.actorId);
    await usageService.recordClipOperation(params.actorId);
    await prisma.clipCandidate.deleteMany({ where: { sessionId: params.sessionId } });
    await getClipsQueue().add(`clips-${params.sessionId}`, { sessionId: params.sessionId });
    return { status: "queued" as const };
  },
};
