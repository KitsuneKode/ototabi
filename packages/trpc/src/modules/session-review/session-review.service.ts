import { TRPCError } from "@trpc/server";

import { mapSessionReview } from "./session-review.mapper";
import { sessionReviewPolicy } from "./session-review.policy";
import { sessionReviewRepository } from "./session-review.repository";

export const sessionReviewService = {
  /**
   * Single API round-trip for session review surfaces (recordings + export).
   * One auth-scoped session fetch, then parallel reads for related data — no N+1.
   */
  async getSessionReview(params: { actorId: string; sessionId: string }) {
    const session = await sessionReviewRepository.findSessionForActor(
      params.sessionId,
      params.actorId,
    );

    if (!sessionReviewPolicy.canViewSession(session)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    }

    const bundle = await sessionReviewRepository.loadReviewBundle(params.sessionId);
    return mapSessionReview(session, bundle);
  },
};
