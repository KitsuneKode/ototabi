"use client";

import { useQuery } from "@tanstack/react-query";
import { Room, RoomEvent } from "livekit-client";
import { useEffect, useRef, useState } from "react";

import { apiUrl } from "@/lib/api-base";
import { RecorderManager } from "@/lib/recorder/recorder-manager";
import config from "@/utils/config";

export type StudioConnectionPhase = "idle" | "loading" | "connected" | "error";

type ConnectionParams = {
  room: Room;
  roomCode: string;
  roomDbId: string | undefined;
  username: string;
  inviteToken: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  enabled: boolean;
  onDataReceived: (payload: Uint8Array, participant?: { identity?: string }) => void;
  onReconnected: () => void;
  onLeaveRoom: (roomDbId: string) => void;
  assertRecordingConsent?: () => Promise<boolean>;
};

export function useStudioConnection(params: ConnectionParams) {
  const [connectionPhase, setConnectionPhase] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [connectionError, setConnectionError] = useState("");
  const [connectionHealth, setConnectionHealth] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");
  const [connectionMessage, setConnectionMessage] = useState("");

  const recorderManager = useRef<RecorderManager | null>(null);
  const onDataReceivedRef = useRef(params.onDataReceived);
  const onReconnectedRef = useRef(params.onReconnected);
  const onLeaveRoomRef = useRef(params.onLeaveRoom);

  onDataReceivedRef.current = params.onDataReceived;
  onReconnectedRef.current = params.onReconnected;
  onLeaveRoomRef.current = params.onLeaveRoom;

  const {
    data: tokenData,
    isLoading: tokenIsLoading,
    error: tokenError,
    isError: tokenIsError,
  } = useQuery({
    queryKey: ["studio-token", params.roomCode, params.username, params.inviteToken],
    queryFn: async () => {
      const tokenParams = new URLSearchParams({
        room: params.roomCode,
        username: params.username,
      });
      if (params.inviteToken) tokenParams.set("invite", params.inviteToken);
      const resp = await fetch(`${apiUrl("/api/token")}?${tokenParams}`);
      if (!resp.ok) throw new Error(`Token request failed: ${resp.status}`);
      const data = (await resp.json()) as { token?: string };
      if (!data.token) throw new Error("No token returned from server");
      return data.token;
    },
    enabled: params.enabled && !!params.roomDbId && !!params.username,
  });

  const token = tokenData;

  useEffect(() => {
    if (!token || !params.enabled) {
      return;
    }

    const { room } = params;
    let cancelled = false;

    const handleData = (payload: Uint8Array, participant?: { identity?: string }) => {
      onDataReceivedRef.current(payload, participant);
    };

    const onDisconnected = () => {
      setConnectionHealth("disconnected");
      setConnectionMessage("Disconnected from studio");
    };

    const onReconnecting = () => {
      setConnectionHealth("reconnecting");
      setConnectionMessage("Reconnecting...");
    };

    const onReconnected = () => {
      setConnectionMessage("");
      setConnectionHealth("connected");
      onReconnectedRef.current();
    };

    (async () => {
      try {
        setConnectionPhase("connecting");
        setConnectionError("");
        room.on(RoomEvent.DataReceived, handleData);
        room.on(RoomEvent.Disconnected, onDisconnected);
        room.on(RoomEvent.Reconnecting, onReconnecting);
        room.on(RoomEvent.Reconnected, onReconnected);

        await room.connect(config.getConfig("liveKitUrl"), token);
        if (cancelled) return;

        setConnectionHealth("connected");
        setConnectionPhase("connected");

        if (params.videoEnabled) await room.localParticipant.setCameraEnabled(true);
        if (params.audioEnabled) await room.localParticipant.setMicrophoneEnabled(true);
        if (params.screenShareEnabled) await room.localParticipant.setScreenShareEnabled(true);

        recorderManager.current = new RecorderManager({
          room,
          assertRecordingConsent: params.assertRecordingConsent,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setConnectionError(err instanceof Error ? err.message : "Failed to connect to studio");
        setConnectionPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      recorderManager.current?.cleanup();
      recorderManager.current = null;
      void room.disconnect();
    };
  }, [
    token,
    params.enabled,
    params.audioEnabled,
    params.videoEnabled,
    params.screenShareEnabled,
    params.room,
    params.assertRecordingConsent,
  ]);

  const roomDbId = params.roomDbId;
  useEffect(() => {
    return () => {
      if (roomDbId) onLeaveRoomRef.current(roomDbId);
    };
  }, [roomDbId]);

  const phase: StudioConnectionPhase = !params.enabled
    ? "idle"
    : tokenIsLoading || connectionPhase === "connecting"
      ? "loading"
      : tokenIsError || connectionPhase === "error"
        ? "error"
        : connectionPhase === "connected"
          ? "connected"
          : "idle";

  const error = tokenError ? tokenError.message : connectionError;

  return {
    phase,
    error,
    connectionHealth,
    connectionMessage,
    setConnectionMessage,
    recorderManager,
  };
}
