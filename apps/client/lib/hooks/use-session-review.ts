"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuthGate } from "@/lib/hooks/use-session";
import { deriveSessionReviewView } from "@/lib/session-review-utils";
import { useTRPC } from "@/trpc/client";

const SESSION_REVIEW_STALE_MS = 60_000;

/** Server state via React Query; derived view flags via shared utils + useMemo. */
export function useSessionReview(sessionId: string) {
  const trpc = useTRPC();
  const { sessionReady, isBooting } = useAuthGate();

  const query = useQuery({
    ...trpc.sessionReview.get.queryOptions(
      { sessionId },
      {
        enabled: !!sessionId && sessionReady,
        staleTime: SESSION_REVIEW_STALE_MS,
        placeholderData: (previous) => previous,
        refetchInterval: (q) => {
          const status = q.state.data?.aiStatus;
          const sessionStatus = q.state.data?.session?.status;
          if (status === "processing" || (sessionStatus === "COMPLETED" && status === "pending")) {
            return 8_000;
          }
          return false;
        },
      },
    ),
  });

  const data = query.data;

  const { timelineEvents, allUploaded, aggregateUploadStatus } = useMemo(
    () => deriveSessionReviewView(data),
    [data],
  );

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
    timelineEvents,
    allUploaded,
    aggregateUploadStatus,
    isBootingAuth: isBooting,
    isReady: sessionReady && query.isSuccess && !!data,
  };
}
