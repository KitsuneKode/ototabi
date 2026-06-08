import type { AppRouter } from "@ototabi/trpc";
import type { inferRouterOutputs } from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type SessionReviewBundle = RouterOutputs["sessionReview"]["get"];
export type SessionReviewSession = SessionReviewBundle["session"];
export type SessionReviewTrack = SessionReviewSession["tracks"][number];
export type TranscriptSegment = SessionReviewBundle["transcriptSegments"][number];
export type UsageGet = RouterOutputs["usage"]["get"];
