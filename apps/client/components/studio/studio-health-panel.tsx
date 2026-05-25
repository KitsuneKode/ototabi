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
  type StudioConsentUiStatus,
  type StudioRecoveryUiHint,
  type StudioUploadUiStatus,
  type UploadProgressEntry,
} from "@ototabi/trpc/studio-health";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { formatParticipantLabel } from "@/lib/guest-display";
import { db } from "@/lib/localDB";
import { useTRPC } from "@/trpc/client";

export type StudioUploadProgressRow = {
  name: string;
  progress: number;
  uploadedParts?: number;
  totalParts?: number;
};

type StudioHealthPanelProps = {
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

const consentLabel: Record<StudioConsentUiStatus, string> = {
  granted: "Consented",
  pending: "Consent needed",
  not_required: "—",
};

const uploadLabel: Record<StudioUploadUiStatus, string> = {
  idle: "Idle",
  uploading: "Uploading",
  complete: "Complete",
  stalled: "Stalled",
};

const recoveryLabel: Record<StudioRecoveryUiHint, string> = {
  none: "OK",
  recoverable: "OPFS recovery",
  active: "Recovering",
};

const connectionLed: Record<StudioConnectionUiStatus, "green" | "amber" | "red" | "green-off"> = {
  connected: "green",
  reconnecting: "amber",
  disconnected: "red",
  unknown: "green-off",
};

function resolveDeviceLabel(deviceId: string, label: string): string {
  if (!deviceId) return "Default";
  if (label) return label.length > 28 ? `${label.slice(0, 25)}…` : label;
  return deviceId.length > 12 ? `…${deviceId.slice(-8)}` : deviceId;
}

export function StudioHealthPanel({
  roomDbId,
  localUserId,
  localUserEmail,
  localRole,
  isRecording,
  localConnectionHealth,
  uploadProgress,
  micDeviceId = "",
  camDeviceId = "",
}: StudioHealthPanelProps) {
  const trpc = useTRPC();
  const liveParticipants = useParticipants();
  const [localPendingTracks, setLocalPendingTracks] = useState(0);
  const [micLabel, setMicLabel] = useState("");
  const [camLabel, setCamLabel] = useState("");

  const healthQuery = useQuery(
    trpc.rooms.getStudioHealth.queryOptions(
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
    () => healthQuery.data?.participants ?? [],
    [healthQuery.data?.participants],
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
    const built: {
      key: string;
      label: string;
      isLocal: boolean;
      consent: StudioConsentUiStatus;
      uploadStatus: StudioUploadUiStatus;
      recovery: StudioRecoveryUiHint;
      connection: StudioConnectionUiStatus;
      deviceSummary: string;
      uploadDetail: string;
    }[] = [];

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

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <PanelTitle
        label="Diagnostics"
        title="Session health"
        className="border-border mb-4 border-b pb-3"
      />

      {healthQuery.isError ? (
        <AnalogInset className="p-3">
          <MonoLabel className="text-[9px] text-yellow-600 dark:text-yellow-400">
            Health snapshot unavailable
          </MonoLabel>
        </AnalogInset>
      ) : null}

      {rows.length === 0 ? (
        <AnalogInset className="border-dashed p-6 text-center">
          <MonoLabel className="text-[9px]">Waiting for participants…</MonoLabel>
        </AnalogInset>
      ) : (
        <ul className="space-y-3" aria-label="Per-participant session health">
          {rows.map((row) => (
            <li key={row.key}>
              <AnalogInset className="flex flex-col gap-2.5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] font-bold tracking-wide uppercase">
                    {row.label}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {row.isLocal ? <MonoLabel className="text-[9px]">YOU</MonoLabel> : null}
                    <LedInline color={connectionLed[row.connection]} size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[9px] tracking-wide uppercase">
                  <div>
                    <MonoLabel className="text-muted-foreground mb-0.5 block text-[8px]">
                      Link
                    </MonoLabel>
                    <StatusBadge variant={row.connection === "connected" ? "ok" : "warn"}>
                      {row.connection}
                    </StatusBadge>
                  </div>
                  <div>
                    <MonoLabel className="text-muted-foreground mb-0.5 block text-[8px]">
                      Upload
                    </MonoLabel>
                    <StatusBadge
                      variant={
                        row.uploadStatus === "complete"
                          ? "ok"
                          : row.uploadStatus === "stalled"
                            ? "warn"
                            : "default"
                      }
                    >
                      {uploadLabel[row.uploadStatus]}
                    </StatusBadge>
                  </div>
                  <div>
                    <MonoLabel className="text-muted-foreground mb-0.5 block text-[8px]">
                      Consent
                    </MonoLabel>
                    <StatusBadge
                      variant={
                        row.consent === "granted"
                          ? "ok"
                          : row.consent === "pending"
                            ? "warn"
                            : "default"
                      }
                    >
                      {consentLabel[row.consent]}
                    </StatusBadge>
                  </div>
                  <div>
                    <MonoLabel className="text-muted-foreground mb-0.5 block text-[8px]">
                      Recovery
                    </MonoLabel>
                    <StatusBadge variant={row.recovery === "recoverable" ? "warn" : "default"}>
                      {recoveryLabel[row.recovery]}
                    </StatusBadge>
                  </div>
                </div>

                <div className="text-muted-foreground/80 space-y-1 font-mono text-[9px] leading-snug">
                  <p className="truncate uppercase">{row.deviceSummary}</p>
                  <p className="truncate uppercase">{row.uploadDetail}</p>
                  {row.recovery === "recoverable" ? (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      Local OPFS has {localPendingTracks} pending track
                      {localPendingTracks === 1 ? "" : "s"} — open Recovery console after session.
                    </p>
                  ) : null}
                </div>
              </AnalogInset>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
