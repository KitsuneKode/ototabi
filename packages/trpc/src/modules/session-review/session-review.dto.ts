import { z } from "zod";

export const getSessionReviewSchema = z.object({
  sessionId: z.string().min(1),
});

export const retryTranscriptSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * `sessionReview.get` response contract (Stream D: consume only — do not change field names
 * without coordinating a DTO freeze break).
 *
 * ```ts
 * {
 *   session: { id, mode, status, startedAt, endedAt, room, tracks[] };
 *   events: Array<{ id, type, occurredAt, trackSid, message, user }>;
 *   syncMarkers: Array<{ id, localTime, createdAt, trackSid }>;
 *   transcriptSegments: Array<{ id, sessionId, startTime, endTime, text, confidence }>;
 *   chapters: Array<{ id, sessionId, startTime, endTime, title }>;
 *   showNotes: { id, summary, keywords, seoTitles, createdAt } | null;
 *   clipCandidates: Array<{
 *     id, startTime, endTime, score, rationale, layout,
 *     renderStatus, renderS3Key, renderError
 *   }>;
 *   exports: {
 *     episodeMp3: { status, s3Key, error };
 *     landscape: { status, s3Key, error };
 *   };
 *   aiStatus: "pending" | "processing" | "ready";
 *   transcriptStatus: "none" | "queued" | "ready" | "waiting_upload";
 * }
 * ```
 */
export type SessionReviewGetResponse = {
  session: {
    id: string;
    mode: string;
    status: string;
    startedAt: Date;
    endedAt: Date | null;
    room: { id: string; name: string; code: string };
    tracks: Array<{
      id: string;
      trackSid: string;
      type: string;
      status: string;
      s3Key: string;
      s3Url: string | null;
      user: { id: string; name: string } | null;
    }>;
  };
  events: Array<{
    id: string;
    type: string;
    occurredAt: Date;
    trackSid: string | null;
    message: string | null;
    user: { name: string } | null;
  }>;
  syncMarkers: Array<{
    id: string;
    localTime: number;
    createdAt: Date;
    trackSid: string | null;
  }>;
  transcriptSegments: Array<{
    id: string;
    sessionId: string;
    startTime: number;
    endTime: number;
    text: string;
    confidence: number | null;
  }>;
  chapters: Array<{
    id: string;
    sessionId: string;
    startTime: number;
    endTime: number | null;
    title: string;
  }>;
  showNotes: {
    id: string;
    summary: string;
    keywords: unknown;
    seoTitles: unknown;
    createdAt: Date;
  } | null;
  clipCandidates: Array<{
    id: string;
    startTime: number;
    endTime: number;
    score: number;
    rationale: string;
    layout: string;
    renderStatus: string;
    renderS3Key: string | null;
    renderError: string | null;
  }>;
  exports: {
    episodeMp3: { status: string; s3Key: string | null; error: string | null };
    landscape: { status: string; s3Key: string | null; error: string | null };
  };
  aiStatus: "pending" | "processing" | "ready";
  transcriptStatus: "none" | "queued" | "ready" | "waiting_upload";
};
