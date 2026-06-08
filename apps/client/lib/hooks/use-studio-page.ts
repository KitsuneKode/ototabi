"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Room, type RoomOptions } from "livekit-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { RecorderManager } from "@/lib/recorder/recorder-manager";

import { formatParticipantLabel } from "@/lib/guest-display";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useStudioConnection } from "@/lib/hooks/use-studio-connection";
import { useTimer } from "@/lib/hooks/use-timer";
import { resolveQualityConfig, type StudioQuality } from "@/lib/studio/quality-presets";
import { publishSyncMarker } from "@/lib/studio/sync-marker-publisher";
import { useTRPC } from "@/trpc/client";

export type StudioUploadProgressEntry = {
  name: string;
  progress: number;
  type: string;
  uploadedParts?: number;
  totalParts?: number;
};

export type StudioSidebarTab = "health" | "uploads" | "chat";

export function useStudioPage(roomId: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();

  const audioEnabled = searchParams.get("audioEnabled") === "true";
  const videoEnabled = searchParams.get("videoEnabled") === "true";
  const screenShareEnabled = searchParams.get("screenShareEnabled") === "true";
  const inviteToken = searchParams.get("invite") || "";
  const micId = searchParams.get("micId") || "";
  const camId = searchParams.get("camId") || "";
  const quality = (searchParams.get("quality") as StudioQuality) || "720p";
  const qualityConfig = resolveQualityConfig(quality);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<string, StudioUploadProgressEntry>>(new Map());
  const [sidebarTab, setSidebarTab] = useState<StudioSidebarTab>("health");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  const activeSessionIdRef = useRef<string | null>(null);
  const pendingRemoteSessionIdRef = useRef<string | null>(null);
  const consentResolverRef = useRef<((granted: boolean) => void) | null>(null);
  const roomRef = useRef<Room | null>(null);
  const recorderManagerRef = useRef<{ current: RecorderManager | null } | null>(null);

  const recordingSeconds = useTimer(isRecording);

  const { data: authStateData, isLoading: authStateIsLoading } = useQuery(
    trpc.auth.getSession.queryOptions(),
  );
  const sessionUser = authStateData?.user;
  const sessionRole = authStateData?.user?.role;
  const operatorLabel = sessionUser
    ? formatParticipantLabel({
        name: sessionUser.name,
        email: sessionUser.email,
        isLocalGuest: sessionRole === "guest",
      })
    : "";

  const { data: roomDetails } = useQuery(
    trpc.rooms.getRoom.queryOptions({ code: roomId }, { enabled: !!roomId }),
  );

  const { data: studioContextData, refetch: studioContextRefetch } = useQuery(
    trpc.studioAccess.getStudioContext.queryOptions(
      { roomId: roomDetails?.id ?? "" },
      { enabled: !!roomDetails?.id },
    ),
  );
  const hasRecordingConsent = studioContextData?.hasRecordingConsent ?? false;
  const canControlStudio = studioContextData?.canControlStudio ?? false;

  const consentMutation = useMutation(
    trpc.studioAccess.acknowledgeRecordingConsent.mutationOptions({
      onSuccess: () => studioContextRefetch(),
    }),
  );
  const startSessionMutation = useMutation(trpc.recordings.startRecordingSession.mutationOptions());
  const stopSessionMutation = useMutation(trpc.recordings.stopRecordingSession.mutationOptions());
  const leaveRoomMutation = useMutation(trpc.studioAccess.leaveRoom.mutationOptions());
  const createEventMutation = useMutation(trpc.recordingEvents.create.mutationOptions());
  const submitSyncMarkerMutation = useMutation(trpc.syncMarkers.submit.mutationOptions());

  const leaveRoomMutateRef = useRef(leaveRoomMutation.mutate);
  const createEventMutateRef = useRef(createEventMutation.mutate);
  const submitSyncMarkerMutateRef = useRef(submitSyncMarkerMutation.mutate);
  leaveRoomMutateRef.current = leaveRoomMutation.mutate;
  createEventMutateRef.current = createEventMutation.mutate;
  submitSyncMarkerMutateRef.current = submitSyncMarkerMutation.mutate;

  const getRoom = useCallback((): Room => {
    if (!roomRef.current) {
      roomRef.current = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          deviceId: camId || undefined,
          resolution: qualityConfig.resolution,
        },
        audioCaptureDefaults: {
          deviceId: micId || undefined,
        },
        publishDefaults: {
          videoEncoding: {
            maxBitrate: qualityConfig.maxBitrate,
            maxFramerate: 30,
          },
        },
      } as RoomOptions);
    }
    return roomRef.current;
  }, [camId, micId, qualityConfig.maxBitrate, qualityConfig.resolution]);

  const room = getRoom();

  const ensureRecordingConsent = useCallback(async (): Promise<boolean> => {
    if (hasRecordingConsent) return true;
    return new Promise((resolve) => {
      consentResolverRef.current = resolve;
      setConsentOpen(true);
    });
  }, [hasRecordingConsent]);

  useEffect(() => {
    if (!hasRecordingConsent || !pendingRemoteSessionIdRef.current) return;
    const sessionId = pendingRemoteSessionIdRef.current;
    pendingRemoteSessionIdRef.current = null;
    void recorderManagerRef.current?.current?.startRecording(sessionId).catch((err) => {
      console.error("Deferred remote recording failed:", err);
    });
  }, [hasRecordingConsent]);

  const broadcastMuteRequest = useCallback(
    (targetUserId: string) => {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "mute_request", targetUserId }),
      );
      void room.localParticipant.publishData(payload, { reliable: true });
    },
    [room],
  );

  useEffect(() => {
    if (!isRecording || isPaused || !activeSessionIdRef.current) return;

    const publishMarker = () => {
      const sessionId = activeSessionIdRef.current;
      if (!sessionId) return;
      void publishSyncMarker({
        room,
        sessionId,
        submit: (input) => submitSyncMarkerMutateRef.current(input),
        publishData: (payload) =>
          room.localParticipant.publishData(payload, { reliable: false }).catch(() => undefined),
      });
    };

    publishMarker();
    const intervalId = window.setInterval(publishMarker, 2000);
    return () => window.clearInterval(intervalId);
  }, [isRecording, isPaused, room]);

  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: { identity?: string }) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "start_recording") {
          activeSessionIdRef.current = data.sessionId;
          setIsRecording(true);
          void (async () => {
            const ok = await ensureRecordingConsent();
            if (!ok) {
              pendingRemoteSessionIdRef.current = data.sessionId;
              return;
            }
            try {
              await recorderManagerRef.current?.current?.startRecording(data.sessionId);
            } catch (err) {
              console.error("Remote recording start failed:", err);
            }
          })();
        } else if (data.type === "mute_request" && data.targetUserId === sessionUser?.id) {
          void room.localParticipant.setMicrophoneEnabled(false);
        } else if (data.type === "stop_recording") {
          setIsRecording(false);
          activeSessionIdRef.current = null;
          void recorderManagerRef.current?.current?.stopRecording();
        } else if (data.type === "upload_progress") {
          const uploadedParts =
            typeof data.uploadedParts === "number" ? data.uploadedParts : undefined;
          const totalParts = typeof data.totalParts === "number" ? data.totalParts : undefined;
          const progress =
            totalParts && totalParts > 0 && uploadedParts !== undefined
              ? Math.min(Math.round((uploadedParts / totalParts) * 100), data.progress ?? 99)
              : (data.progress ?? 0);

          setProgressMap((prev) => {
            const next = new Map(prev);
            next.set(data.trackSid, {
              name: participant?.identity || "Guest",
              progress,
              uploadedParts,
              totalParts,
              type: data.trackSid.includes("video") ? "VIDEO" : "AUDIO",
            });
            return next;
          });
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [ensureRecordingConsent, sessionUser?.id, room],
  );

  const connection = useStudioConnection({
    room,
    roomCode: roomId,
    roomDbId: roomDetails?.id,
    username: sessionUser?.name || sessionUser?.email || "",
    inviteToken,
    audioEnabled,
    videoEnabled,
    screenShareEnabled,
    enabled: !!sessionUser && !!roomDetails?.id,
    onDataReceived: handleDataReceived,
    onReconnected: () => {
      const sessionId = activeSessionIdRef.current;
      if (sessionId) {
        createEventMutateRef.current({
          sessionId,
          type: "RECONNECT",
          message: "Participant reconnected to studio",
        });
      }
    },
    onLeaveRoom: (dbRoomId) => {
      leaveRoomMutateRef.current({ roomId: dbRoomId });
    },
    assertRecordingConsent: ensureRecordingConsent,
  });

  recorderManagerRef.current = connection.recorderManager;
  const connectionHealth = connection.connectionHealth;
  const connectionError = connection.connectionMessage || connection.error;

  const handleStartRecording = async () => {
    if (!roomDetails || !canControlStudio) return;
    const consented = await ensureRecordingConsent();
    if (!consented) return;
    try {
      const session = await startSessionMutation.mutateAsync({
        roomId: roomDetails.id,
      });
      activeSessionIdRef.current = session.id;
      setIsRecording(true);
      setIsPaused(false);
      await connection.recorderManager.current?.startRecording(session.id);

      const data = new TextEncoder().encode(
        JSON.stringify({ type: "start_recording", sessionId: session.id }),
      );
      await room.localParticipant.publishData(data, { reliable: true });
    } catch (e) {
      console.error("Failed starting recording:", e);
    }
  };

  const handleStopRecording = async () => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId) return;
    try {
      await stopSessionMutation.mutateAsync({ sessionId });
      setIsRecording(false);
      setIsPaused(false);
      activeSessionIdRef.current = null;
      await connection.recorderManager.current?.stopRecording();

      const data = new TextEncoder().encode(JSON.stringify({ type: "stop_recording" }));
      await room.localParticipant.publishData(data, { reliable: true });
    } catch (e) {
      console.error("Failed stopping recording:", e);
    }
  };

  const handleTogglePause = () => {
    const sessionId = activeSessionIdRef.current;
    if (isPaused) {
      connection.recorderManager.current?.resumeRecording();
      if (sessionId) {
        createEventMutateRef.current({
          sessionId,
          type: "RESUME",
          message: "Recording resumed",
        });
      }
      setIsPaused(false);
    } else {
      connection.recorderManager.current?.pauseRecording();
      if (sessionId) {
        createEventMutateRef.current({
          sessionId,
          type: "PAUSE",
          message: "Recording paused",
        });
      }
      setIsPaused(true);
    }
  };

  const isCreator = roomDetails && sessionUser ? roomDetails.creatorId === sessionUser.id : false;

  const handleConsentAccept = async () => {
    if (!roomDetails?.id) return;
    try {
      await consentMutation.mutateAsync({ roomId: roomDetails.id });
      setConsentOpen(false);
      consentResolverRef.current?.(true);
      consentResolverRef.current = null;
    } catch (err) {
      console.error("Consent save failed:", err);
    }
  };

  const handleConsentDecline = () => {
    setConsentOpen(false);
    consentResolverRef.current?.(false);
    consentResolverRef.current = null;
    pendingRemoteSessionIdRef.current = null;
  };

  useKeyboardShortcuts({
    toggleRecording: () => {
      if (!canControlStudio) return;
      if (isRecording) void handleStopRecording();
      else void handleStartRecording();
    },
    toggleMute: () =>
      room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled),
    toggleVideo: () =>
      room.localParticipant.setCameraEnabled(!room.localParticipant.isCameraEnabled),
    toggleScreenShare: () =>
      room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled),
    pttDown: () => room.localParticipant.setMicrophoneEnabled(true),
    pttUp: () => room.localParticipant.setMicrophoneEnabled(false),
    toggleShortcuts: () => setShortcutsOpen((p) => !p),
    dismiss: () => {
      setShortcutsOpen(false);
      setSidebarOpen(false);
    },
  });

  return {
    router,
    room,
    roomId,
    micId,
    camId,
    authStateIsLoading,
    authStateData,
    sessionUser,
    sessionRole,
    operatorLabel,
    roomDetails,
    canControlStudio,
    isCreator,
    isRecording,
    isPaused,
    recordingSeconds,
    progressMap,
    sidebarTab,
    setSidebarTab,
    shortcutsOpen,
    setShortcutsOpen,
    sidebarOpen,
    setSidebarOpen,
    consentOpen,
    consentMutation,
    connection,
    connectionHealth,
    connectionError,
    broadcastMuteRequest,
    handleStartRecording,
    handleStopRecording,
    handleTogglePause,
    handleConsentAccept,
    handleConsentDecline,
  };
}
