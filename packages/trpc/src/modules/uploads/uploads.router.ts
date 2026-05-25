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

  getSignedDownloadUrl: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(({ input, ctx }) =>
      uploadsService.getSignedDownloadUrl({ key: input.key, userId: ctx.session.user.id }),
    ),

  getUploadStatus: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .query(({ input, ctx }) =>
      uploadsService.getUploadStatus({ trackId: input.trackId, userId: ctx.session.user.id }),
    ),

  retryUpload: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .mutation(({ input, ctx }) =>
      uploadsService.retryUpload({ trackId: input.trackId, userId: ctx.session.user.id }),
    ),
} satisfies TRPCRouterRecord;
