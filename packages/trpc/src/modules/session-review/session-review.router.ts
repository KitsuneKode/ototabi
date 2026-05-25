import type { TRPCRouterRecord } from "@trpc/server";

import { hostProcedure } from "../../trpc";
import { getSessionReviewSchema } from "./session-review.dto";
import { sessionReviewService } from "./session-review.service";

export const sessionReviewRouter = {
  get: hostProcedure.input(getSessionReviewSchema).query(({ input, ctx }) =>
    sessionReviewService.getSessionReview({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),
} satisfies TRPCRouterRecord;
