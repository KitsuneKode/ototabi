import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { hostProcedure, hostProProcedure } from "../../trpc";
import {
  getSessionReviewSchema,
  regenerateLlmSchema,
  retryTranscriptSchema,
  updateShowNotesSchema,
} from "./session-review.dto";
import { sessionReviewService } from "./session-review.service";

const queueSessionExportSchema = z.object({
  sessionId: z.string().min(1),
  preset: z.enum(["landscape_16_9", "episode_mp3"]),
  force: z.boolean().optional(),
});

export const sessionReviewRouter = {
  get: hostProcedure.input(getSessionReviewSchema).query(({ input, ctx }) =>
    sessionReviewService.getSessionReview({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  getStatus: hostProcedure.input(getSessionReviewSchema).query(({ input, ctx }) =>
    sessionReviewService.getSessionStatus({
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

  queueSessionExport: hostProProcedure.input(queueSessionExportSchema).mutation(({ input, ctx }) =>
    sessionReviewService.queueSessionExport({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      preset: input.preset,
      force: input.force,
    }),
  ),

  regenerateLlm: hostProProcedure.input(regenerateLlmSchema).mutation(({ input, ctx }) =>
    sessionReviewService.regenerateLlm({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  updateShowNotes: hostProProcedure.input(updateShowNotesSchema).mutation(({ input, ctx }) =>
    sessionReviewService.updateShowNotesSummary({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      summary: input.summary,
    }),
  ),
} satisfies TRPCRouterRecord;
