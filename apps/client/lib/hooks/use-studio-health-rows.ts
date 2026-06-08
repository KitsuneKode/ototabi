"use client";

import { useParticipants } from "@livekit/components-react";
import {
  aggregateUploadProgressByIdentity,
  mapConnectionUiStatus,
  mapConsentUiStatus,
  mapRecoveryUiHint,
  mapUploadQueueUiStatus,
  matchParticipantIdentity,
  type StudioConnectionUiStatus,
  type UploadProgressEntry,
} from "@ototabi/trpc/studio-health";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { StudioUploadProgressRow } from "@/components/studio/studio-health-panel";
import type { StudioHealthParticipantRowData } from "@/components/studio/studio-health-participant-row";

import { resolveDeviceLabel } from "@/components/studio/studio-health-labels";
import { formatParticipantLabel } from "@/lib/guest-display";
import { db } from "@/lib/localDB";
import { useTRPC } from "@/trpc/client";

type UseStudioHealthRowsParams = {
  roomDbId: string;
  localUserId: string;
  localUserEmail?: string | null;
  localRole?: string;
  isRecording: boolean;
  localConnectionHealth: StudioConnectionUiStatus;
  uploadProgress: StudioUploadProgressRow[];
  micDeviceId?: string;
  camDeviceId?: string;
};

export function useStudioHealthRows({
  roomDbId,
  localUserId,
  localUserEmail,
  localRole,
  isRecording,
  localConnectionHealth,
  uploadProgress,
  micDeviceId = "",
  camDeviceId = "",
}: UseStudioHealthRowsParams) {
  const trpc = useTRPC();
  const liveParticipants = useParticipants();
  const [localPendingTracks, setLocalPendingTracks] = useState(0);
  const [micLabel, setMicLabel] = useState("");
  const [camLabel, setCamLabel] = useState("");

  const { data: healthQueryData, isError: healthQueryIsError } = useQuery(
    trpc.studioAccess.getStudioHealth.queryOptions(
      { roomId: roomDbId },
      { enabled: !!roomDbId, refetchInterval: isRecording ? 8_000 : 20_000 },
    ),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sessions = await db.uploadSessions.toArray();
        if (cancelled) return;
        setLocalPendingTracks(sessions.length);
      } catch {
        if (!cancelled) setLocalPendingTracks(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uploadProgress.length, isRecording]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const mic = devices.find((d) => d.deviceId === micDeviceId && d.kind === "audioinput");
        const cam = devices.find((d) => d.deviceId === camDeviceId && d.kind === "videoinput");
        setMicLabel(mic?.label ?? "");
        setCamLabel(cam?.label ?? "");
      } catch {
        if (!cancelled) {
          setMicLabel("");
          setCamLabel("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [micDeviceId, camDeviceId]);

  const serverParticipants = useMemo(
    () => healthQueryData?.participants ?? [],
    [healthQueryData?.participants],
  );

  const progressByIdentity = useMemo(
    () =>
      uploadProgress.map((row) => ({
        identity: row.name,
        entry: {
          progress: row.progress,
          uploadedParts: row.uploadedParts,
          totalParts: row.totalParts,
        } satisfies UploadProgressEntry,
      })),
    [uploadProgress],
  );

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const built: StudioHealthParticipantRowData[] = [];

    const buildRow = (params: {
      key: string;
      identity: string;
      displayLabel: string;
      isLocal: boolean;
      isPresentInRoom: boolean;
    }) => {
      if (seen.has(params.key)) return;
      seen.add(params.key);

      const matchedUserId =
        matchParticipantIdentity(params.identity, serverParticipants) ??
        (params.isLocal ? localUserId : null);

      const serverRow = matchedUserId
        ? serverParticipants.find((p) => p.userId === matchedUserId)
        : undefined;

      const uploadEntries = aggregateUploadProgressByIdentity(progressByIdentity, params.identity);

      built.push({
        key: params.key,
        label: params.displayLabel,
        isLocal: params.isLocal,
        consent: mapConsentUiStatus({
          hasRecordingConsent: serverRow?.hasRecordingConsent ?? false,
          sessionRecording: isRecording,
        }),
        uploadStatus: mapUploadQueueUiStatus(uploadEntries),
        recovery: mapRecoveryUiHint({
          pendingLocalTrackCount: params.isLocal ? localPendingTracks : 0,
          isLocalParticipant: params.isLocal,
        }),
        connection: mapConnectionUiStatus({
          isLocal: params.isLocal,
          localHealth: localConnectionHealth,
          isPresentInRoom: params.isPresentInRoom,
        }),
        deviceSummary: params.isLocal
          ? `Mic: ${resolveDeviceLabel(micDeviceId, micLabel)} · Cam: ${resolveDeviceLabel(camDeviceId, camLabel)}`
          : "Remote devices",
        uploadDetail:
          uploadEntries.length > 0
            ? `${uploadEntries.length} track${uploadEntries.length === 1 ? "" : "s"}`
            : "No active uploads",
      });
    };

    for (const p of liveParticipants) {
      const identity = p.identity || p.name || "Participant";
      const isLocal = p.isLocal;
      buildRow({
        key: p.sid,
        identity,
        displayLabel: formatParticipantLabel({
          name: p.name || identity,
          email: isLocal ? localUserEmail : identity,
          isLocalGuest: localRole === "guest" && isLocal,
        }),
        isLocal,
        isPresentInRoom: true,
      });
    }

    for (const sp of serverParticipants) {
      const identity = sp.name || sp.email || sp.userId;
      buildRow({
        key: `db-${sp.userId}`,
        identity,
        displayLabel: formatParticipantLabel({
          name: sp.name,
          email: sp.email,
          isLocalGuest: false,
        }),
        isLocal: sp.userId === localUserId,
        isPresentInRoom: false,
      });
    }

    return built;
  }, [
    liveParticipants,
    serverParticipants,
    progressByIdentity,
    isRecording,
    localPendingTracks,
    localConnectionHealth,
    localUserId,
    localUserEmail,
    localRole,
    micDeviceId,
    camDeviceId,
    micLabel,
    camLabel,
  ]);

  return { rows, localPendingTracks, healthQueryIsError };
}
