"use client";

import { useMemo } from "react";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { useSessionReview } from "@/lib/hooks/use-session-review";

export function useRecordingSessionPage(sessionId: string) {
  const sessionReview = useSessionReview(sessionId);
  const { session } = sessionReview;

  const tracksByUser = useMemo(() => {
    if (!session) return {} as Record<string, SessionReviewTrack[]>;
    return session.tracks.reduce<Record<string, SessionReviewTrack[]>>((acc, track) => {
      const key = track.user?.name ?? "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(track);
      return acc;
    }, {});
  }, [session]);

  return {
    ...sessionReview,
    tracksByUser,
    totalTracks: session?.tracks.length ?? 0,
  };
}
