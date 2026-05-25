"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import type { TimelineLiteTrack } from "@/components/editor/timeline-lite";

import {
  normalizeTrimRange,
  parseTrimField,
  type TrimRangeSec,
} from "@/components/editor/timeline-math";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useExportConsoleStore } from "@/lib/stores/export-console-store";
import { trpcClient } from "@/trpc/vanilla";

type SessionTrack = {
  id: string;
  type: string;
  status: string;
  s3Url?: string | null;
  s3Key?: string | null;
  user?: { name?: string | null } | null;
};

type SessionForTimeline = {
  startedAt: Date | string;
  endedAt?: Date | string | null;
  tracks: SessionTrack[];
};

export function resolveSessionDurationSec(
  session: Pick<SessionForTimeline, "startedAt" | "endedAt">,
  transcriptEndSec?: number,
): number {
  if (session.endedAt && session.startedAt) {
    const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
    if (ms > 0) return ms / 1000;
  }
  if (transcriptEndSec && transcriptEndSec > 0) return transcriptEndSec;
  return 120;
}

export function useExportTimeline(
  session: SessionForTimeline | null | undefined,
  transcriptEndSec?: number,
  markers: { id: string; label: string; atSec: number }[] = [],
) {
  const trimTrackId = useExportConsoleStore((s) => s.trimTrackId);
  const trimStart = useExportConsoleStore((s) => s.trimStart);
  const trimEnd = useExportConsoleStore((s) => s.trimEnd);
  const playheadSec = useExportConsoleStore((s) => s.playheadSec);
  const setTrimTrackId = useExportConsoleStore((s) => s.setTrimTrackId);
  const setTrimStart = useExportConsoleStore((s) => s.setTrimStart);
  const setTrimEnd = useExportConsoleStore((s) => s.setTrimEnd);
  const setPlayheadSec = useExportConsoleStore((s) => s.setPlayheadSec);

  const durationSec = useMemo(
    () => (session ? resolveSessionDurationSec(session, transcriptEndSec) : 120),
    [session, transcriptEndSec],
  );

  const completedTracks = useMemo(
    () => (session?.tracks ?? []).filter((t) => t.status === "COMPLETED" && (t.s3Url || t.s3Key)),
    [session?.tracks],
  );

  const activeTrackId = trimTrackId ?? completedTracks[0]?.id ?? null;

  const previewTrack = useMemo(() => {
    if (!activeTrackId) return null;
    return completedTracks.find((t) => t.id === activeTrackId) ?? completedTracks[0] ?? null;
  }, [activeTrackId, completedTracks]);

  const previewMediaRef = previewTrack?.s3Url ?? previewTrack?.s3Key ?? null;

  const previewUrlQuery = useQuery({
    queryKey: ["export-preview-url", previewMediaRef],
    queryFn: async () => {
      if (!previewMediaRef) return null;
      return resolveTrackDownloadUrl(trpcClient, previewMediaRef);
    },
    enabled: Boolean(previewMediaRef),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!trimTrackId && completedTracks[0]?.id) {
      setTrimTrackId(completedTracks[0].id);
    }
  }, [trimTrackId, completedTracks, setTrimTrackId]);

  const timelineTracks: TimelineLiteTrack[] = useMemo(
    () =>
      completedTracks.map((track) => ({
        id: track.id,
        label: `${track.user?.name ?? "Guest"} · ${track.type}`,
        durationSec,
      })),
    [completedTracks, durationSec],
  );

  const trimByTrackId = useMemo(() => {
    const map: Record<string, TrimRangeSec> = {};
    for (const track of completedTracks) {
      if (track.id === activeTrackId) {
        const trimIn = parseTrimField(trimStart) ?? 0;
        const trimOut = parseTrimField(trimEnd) ?? durationSec;
        map[track.id] = normalizeTrimRange(trimIn, trimOut, durationSec);
      } else {
        map[track.id] = normalizeTrimRange(0, durationSec, durationSec);
      }
    }
    return map;
  }, [completedTracks, activeTrackId, trimStart, trimEnd, durationSec]);

  const onActiveTrackChange = useCallback(
    (trackId: string) => {
      setTrimTrackId(trackId);
      const existing = trimByTrackId[trackId];
      if (existing) {
        setTrimStart(existing.trimInSec > 0 ? String(existing.trimInSec) : "");
        setTrimEnd(existing.trimOutSec < durationSec ? String(existing.trimOutSec) : "");
      }
    },
    [setTrimTrackId, trimByTrackId, durationSec, setTrimStart, setTrimEnd],
  );

  const onTrimChange = useCallback(
    (trackId: string, range: TrimRangeSec) => {
      setTrimTrackId(trackId);
      setTrimStart(range.trimInSec > 0 ? String(range.trimInSec) : "");
      setTrimEnd(range.trimOutSec < durationSec ? String(range.trimOutSec) : "");
    },
    [setTrimTrackId, setTrimStart, setTrimEnd, durationSec],
  );

  return {
    durationSec,
    playheadSec,
    setPlayheadSec,
    timelineTracks,
    trimByTrackId,
    activeTrackId,
    onActiveTrackChange,
    onTrimChange,
    markers,
    previewVideoUrl: previewUrlQuery.data ?? null,
    hasTimeline: completedTracks.length > 0,
  };
}
