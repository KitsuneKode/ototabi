"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { useAuthGate } from "@/lib/hooks/use-session";
import { deriveSessionReviewView } from "@/lib/session-review-utils";
import { useTRPC } from "@/trpc/client";

const SESSION_REVIEW_STALE_MS = 60_000;
const SESSION_STATUS_POLL_MS = 8_000;

function shouldPollSessionReview(
  data: {
    aiStatus?: string;
    transcriptStatus?: string;
    session?: { status?: string };
    transcriptSegments?: unknown[];
    clipCandidates?: Array<{ renderStatus?: string }>;
    exports?: {
      episodeMp3?: { status?: string };
      landscape?: { status?: string };
    };
    pipeline?: {
      transcript?: { status?: string };
      llm?: { status?: string };
      clips?: { status?: string };
    };
  } | null,
): boolean {
  if (!data) return false;
  const clipRendering = (data.clipCandidates ?? []).some((c) => c.renderStatus === "processing");
  const sessionExportProcessing =
    data.exports?.episodeMp3?.status === "processing" ||
    data.exports?.landscape?.status === "processing";
  const transcriptQueued = data.transcriptStatus === "queued";
  const pipelineProcessing =
    data.pipeline?.transcript?.status === "processing" ||
    data.pipeline?.llm?.status === "processing" ||
    data.pipeline?.clips?.status === "processing";
  const transcriptEmpty = (data.transcriptSegments?.length ?? 0) === 0;

  return (
    data.aiStatus === "processing" ||
    clipRendering ||
    sessionExportProcessing ||
    transcriptQueued ||
    pipelineProcessing ||
    (data.session?.status === "COMPLETED" && (data.aiStatus === "pending" || transcriptEmpty))
  );
}

/** Server state via React Query; derived view flags via shared utils + useMemo. */
export function useSessionReview(sessionId: string) {
  const trpc = useTRPC();
  const { sessionReady, isBooting } = useAuthGate();

  const {
    data: queryData,
    isLoading: queryIsLoading,
    error: queryError,
    refetch: queryRefetch,
    isFetching: queryIsFetching,
    isPending: queryIsPending,
    isSuccess: queryIsSuccess,
    isError: queryIsError,
    status: queryStatus,
  } = useQuery({
    ...trpc.sessionReview.get.queryOptions(
      { sessionId },
      {
        enabled: !!sessionId && sessionReady,
        staleTime: SESSION_REVIEW_STALE_MS,
        placeholderData: (previous) => previous,
      },
    ),
  });

  const polling = shouldPollSessionReview(queryData ?? null);
  const statusSnapshotRef = useRef<string | null>(null);

  const {
    data: statusQueryData,
    isFetching: statusQueryIsFetching,
    dataUpdatedAt: statusDataUpdatedAt,
  } = useQuery({
    ...trpc.sessionReview.getStatus.queryOptions(
      { sessionId },
      {
        enabled: !!sessionId && sessionReady && polling,
        refetchInterval: polling ? SESSION_STATUS_POLL_MS : false,
        staleTime: SESSION_STATUS_POLL_MS - 1_000,
      },
    ),
  });

  useEffect(() => {
    if (!polling || !statusQueryData) return;
    const snapshot = JSON.stringify(statusQueryData);
    if (statusSnapshotRef.current === snapshot) return;
    statusSnapshotRef.current = snapshot;
    void queryRefetch();
  }, [polling, statusQueryData, statusDataUpdatedAt, queryRefetch]);

  const data = queryData;

  const { timelineEvents, allUploaded, aggregateUploadStatus } = useMemo(
    () => deriveSessionReviewView(data),
    [data],
  );

  const query = {
    data: queryData,
    isLoading: queryIsLoading,
    error: queryError,
    refetch: queryRefetch,
    isFetching: queryIsFetching || statusQueryIsFetching,
    isPending: queryIsPending,
    isSuccess: queryIsSuccess,
    isError: queryIsError,
    status: queryStatus,
  };

  return {
    query,
    session: data?.session,
    events: data?.events,
    syncMarkers: data?.syncMarkers,
    transcriptSegments: data?.transcriptSegments,
    chapters: data?.chapters,
    showNotes: data?.showNotes,
    clipCandidates: data?.clipCandidates,
    aiStatus: data?.aiStatus,
    transcriptStatus: data?.transcriptStatus,
    exports: data?.exports,
    exportAssets: data?.exportAssets,
    pipeline: data?.pipeline,
    timelineEvents,
    allUploaded,
    aggregateUploadStatus,
    isBootingAuth: isBooting,
    isReady: sessionReady && queryIsSuccess && !!data,
  };
}
