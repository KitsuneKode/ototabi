import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { hostProcedure, hostProProcedure } from "../../trpc";
import { getSessionReviewSchema, retryTranscriptSchema } from "./session-review.dto";
import { sessionReviewService } from "./session-review.service";

const queueSessionExportSchema = z.object({
  sessionId: z.string().min(1),
  preset: z.enum(["landscape_16_9", "episode_mp3"]),
});

export const sessionReviewRouter = {
  get: hostProcedure.input(getSessionReviewSchema).query(({ input, ctx }) =>
    sessionReviewService.getSessionReview({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  retryTranscript: hostProProcedure.input(retryTranscriptSchema).mutation(({ input, ctx }) =>
    sessionReviewService.retryTranscript({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  queueSessionExport: hostProcedure.input(queueSessionExportSchema).mutation(({ input, ctx }) =>
    sessionReviewService.queueSessionExport({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      preset: input.preset,
    }),
  ),
} satisfies TRPCRouterRecord;
