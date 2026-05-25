import type { PipelineStatus } from "@ototabi/common/pipeline-status";

import type { sessionReviewRepository } from "./session-review.repository";

type SessionRecord = NonNullable<
  Awaited<ReturnType<typeof sessionReviewRepository.findSessionForActor>>
>;

type BundleRecord = Awaited<ReturnType<typeof sessionReviewRepository.loadReviewBundle>>;

type PipelineFields = {
  transcriptStatus: string;
  transcriptError: string | null;
  llmStatus: string;
  llmError: string | null;
  clipsStatus: string;
  clipsError: string | null;
};

export type UiTranscriptStatus =
  | "none"
  | "queued"
  | "ready"
  | "waiting_upload"
  | "failed"
  | "skipped";

export type UiAiStatus = "pending" | "processing" | "ready" | "failed" | "skipped";

function isPipelineStatus(value: string): value is PipelineStatus {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "ready" ||
    value === "failed" ||
    value === "skipped"
  );
}

export function mapTranscriptUiStatus(params: {
  sessionStatus: string;
  dbStatus: string;
  hasSegments: boolean;
  micReady: boolean;
}): UiTranscriptStatus {
  const { sessionStatus, dbStatus, hasSegments, micReady } = params;

  if (hasSegments) return "ready";

  if (isPipelineStatus(dbStatus)) {
    if (dbStatus === "ready") return "ready";
    if (dbStatus === "failed") return "failed";
    if (dbStatus === "skipped") return "skipped";
    if (dbStatus === "processing") return "queued";
  }

  if (sessionStatus !== "COMPLETED") return "none";
  if (!micReady) return "waiting_upload";
  if (dbStatus === "pending") return "none";
  return "queued";
}

export function mapAiUiStatus(params: {
  sessionStatus: string;
  transcriptDbStatus: string;
  llmDbStatus: string;
  clipsDbStatus: string;
  hasTranscript: boolean;
  hasAiArtifacts: boolean;
}): UiAiStatus {
  const {
    sessionStatus,
    transcriptDbStatus,
    llmDbStatus,
    clipsDbStatus,
    hasTranscript,
    hasAiArtifacts,
  } = params;

  const statuses = [transcriptDbStatus, llmDbStatus, clipsDbStatus];
  if (statuses.some((s) => s === "failed")) return "failed";
  if (statuses.every((s) => s === "skipped")) return "skipped";
  if (hasAiArtifacts) return "ready";
  if (
    llmDbStatus === "ready" &&
    clipsDbStatus === "ready" &&
    (transcriptDbStatus === "ready" || hasTranscript)
  ) {
    return "ready";
  }
  if (
    statuses.some((s) => s === "processing") ||
    (hasTranscript &&
      (llmDbStatus === "pending" ||
        llmDbStatus === "processing" ||
        clipsDbStatus === "pending" ||
        clipsDbStatus === "processing"))
  ) {
    return "processing";
  }
  if (sessionStatus === "COMPLETED" && transcriptDbStatus === "processing") {
    return "processing";
  }
  return "pending";
}

type ExportFields = {
  episodeMp3Status: string;
  episodeMp3S3Key: string | null;
  episodeMp3Error: string | null;
  landscapeStatus: string;
  landscapeS3Key: string | null;
  landscapeError: string | null;
} | null;

export function mapSessionReview(
  session: SessionRecord,
  bundle: BundleRecord,
  exportFields?: ExportFields,
  pipeline?: PipelineFields | null,
) {
  const micReady = session.tracks.some(
    (t) =>
      t.type === "MICROPHONE" &&
      t.status === "COMPLETED" &&
      (t.s3Key.length > 0 || t.s3Url != null),
  );

  const transcriptDbStatus = pipeline?.transcriptStatus ?? "pending";
  const llmDbStatus = pipeline?.llmStatus ?? "pending";
  const clipsDbStatus = pipeline?.clipsStatus ?? "pending";

  const hasTranscript = bundle.transcriptSegments.length > 0;
  const hasAiArtifacts =
    bundle.showNotes != null || bundle.chapters.length > 0 || bundle.clipCandidates.length > 0;

  return {
    session: {
      id: session.id,
      mode: session.mode,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      room: session.room,
      tracks: session.tracks.map((track) => ({
        id: track.id,
        trackSid: track.trackSid,
        type: track.type,
        status: track.status,
        s3Key: track.s3Key,
        s3Url: track.s3Url,
        user: track.user,
      })),
    },
    events: bundle.events.map((event) => ({
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt,
      trackSid: event.trackSid,
      message: event.message,
      user: event.user ? { name: event.user.name } : null,
    })),
    syncMarkers: bundle.syncMarkers.map((marker) => ({
      id: marker.id,
      localTime: marker.localTime,
      createdAt: marker.createdAt,
      trackSid: marker.trackSid,
    })),
    transcriptSegments: bundle.transcriptSegments,
    chapters: bundle.chapters,
    showNotes: bundle.showNotes,
    clipCandidates: bundle.clipCandidates,
    exports: {
      episodeMp3: {
        status: exportFields?.episodeMp3Status ?? "pending",
        s3Key: exportFields?.episodeMp3S3Key ?? null,
        error: exportFields?.episodeMp3Error ?? null,
      },
      landscape: {
        status: exportFields?.landscapeStatus ?? "pending",
        s3Key: exportFields?.landscapeS3Key ?? null,
        error: exportFields?.landscapeError ?? null,
      },
    },
    pipeline: {
      transcript: {
        status: transcriptDbStatus,
        error: pipeline?.transcriptError ?? null,
      },
      llm: {
        status: llmDbStatus,
        error: pipeline?.llmError ?? null,
      },
      clips: {
        status: clipsDbStatus,
        error: pipeline?.clipsError ?? null,
      },
    },
    aiStatus: mapAiUiStatus({
      sessionStatus: session.status,
      transcriptDbStatus,
      llmDbStatus,
      clipsDbStatus,
      hasTranscript,
      hasAiArtifacts,
    }),
    transcriptStatus: mapTranscriptUiStatus({
      sessionStatus: session.status,
      dbStatus: transcriptDbStatus,
      hasSegments: hasTranscript,
      micReady,
    }),
  };
}
