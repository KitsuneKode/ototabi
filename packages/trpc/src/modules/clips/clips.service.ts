import { getClipsQueue, getExportQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import { roomsRepository } from "../rooms/rooms.repository";

export const clipsService = {
  async listForSession(params: { actorId: string; sessionId: string }) {
    const canAccess = await roomsRepository.canUserAccessSession(params.sessionId, params.actorId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view clips" });
    }
    return prisma.clipCandidate.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { score: "desc" },
    });
  },

  async queueClipRender(params: { actorId: string; sessionId: string; clipId: string }) {
    const canAccess = await roomsRepository.canUserAccessSession(params.sessionId, params.actorId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }
    const clip = await prisma.clipCandidate.findFirst({
      where: { id: params.clipId, sessionId: params.sessionId },
    });
    if (!clip) throw new TRPCError({ code: "NOT_FOUND", message: "Clip not found" });

    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "processing" },
    });

    await getExportQueue().add(`export-clip-${clip.id}`, {
      sessionId: params.sessionId,
      clipId: clip.id,
      preset: "vertical_9_16",
    });

    return { status: "processing" as const };
  },

  async regenerateClips(params: { actorId: string; sessionId: string }) {
    const canAccess = await roomsRepository.canUserAccessSession(params.sessionId, params.actorId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }
    await prisma.clipCandidate.deleteMany({ where: { sessionId: params.sessionId } });
    await getClipsQueue().add(`clips-${params.sessionId}`, { sessionId: params.sessionId });
    return { status: "queued" as const };
  },
};
