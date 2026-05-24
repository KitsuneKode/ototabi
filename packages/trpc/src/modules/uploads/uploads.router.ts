import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { protectedProcedure } from "../../trpc";
import { uploadsService } from "./uploads.service";

export const uploadsRouter = {
  start: protectedProcedure
    .input(
      z.object({
        trackSid: z.string(),
        sessionId: z.string(),
        type: z.enum(["CAMERA", "MICROPHONE", "SCREENSHARE"]),
      }),
    )
    .mutation(({ input, ctx }) =>
      uploadsService.startUpload({
        trackSid: input.trackSid,
        sessionId: input.sessionId,
        type: input.type,
        userId: ctx.session.user.id,
      }),
    ),

  getSignedUrl: protectedProcedure
    .input(z.object({ key: z.string(), uploadId: z.string(), partNumber: z.number() }))
    .mutation(({ input, ctx }) =>
      uploadsService.getSignedUrl({ ...input, userId: ctx.session.user.id }),
    ),

  listParts: protectedProcedure
    .input(z.object({ key: z.string(), uploadId: z.string() }))
    .mutation(({ input, ctx }) =>
      uploadsService.listParts({ ...input, userId: ctx.session.user.id }),
    ),

  complete: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        uploadId: z.string(),
        parts: z.array(z.object({ ETag: z.string(), PartNumber: z.number() })),
      }),
    )
    .mutation(({ input, ctx }) =>
      uploadsService.completeUpload({ ...input, userId: ctx.session.user.id }),
    ),

  getUploadStatus: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .query(({ input }) => uploadsService.getUploadStatus(input.trackId)),

  retryUpload: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .mutation(({ input }) => uploadsService.retryUpload(input.trackId)),
} satisfies TRPCRouterRecord;
