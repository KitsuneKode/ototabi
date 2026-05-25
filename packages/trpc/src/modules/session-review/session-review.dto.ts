import { z } from "zod";

export const getSessionReviewSchema = z.object({
  sessionId: z.string().min(1),
});
