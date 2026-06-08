"use client";

import { useQuery } from "@tanstack/react-query";
import { Room, RoomEvent } from "livekit-client";
import { useEffect, useReducer, useRef } from "react";

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

type ConnectionPhase = "idle" | "connecting" | "connected" | "error";
type ConnectionHealth = "connected" | "reconnecting" | "disconnected";

type ConnectionState = {
  phase: ConnectionPhase;
  error: string;
  health: ConnectionHealth;
  message: string;
};

type ConnectionAction =
  | { type: "connecting" }
  | { type: "connected" }
  | { type: "error"; error: string }
  | { type: "health"; health: ConnectionHealth; message?: string };

const initialConnectionState: ConnectionState = {
  phase: "idle",
  error: "",
  health: "disconnected",
  message: "",
};

function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case "connecting":
      return { ...state, phase: "connecting", error: "" };
    case "connected":
      return { ...state, phase: "connected", health: "connected", message: "" };
    case "error":
      return { ...state, phase: "error", error: action.error };
    case "health":
      return {
        ...state,
        health: action.health,
        message: action.message ?? state.message,
      };
    default:
      return state;
  }
}

export function useStudioConnection(params: ConnectionParams) {
  const [connection, dispatch] = useReducer(connectionReducer, initialConnectionState);

  const recorderManager = useRef<RecorderManager | null>(null);
  const onDataReceivedRef = useRef(params.onDataReceived);
  const onReconnectedRef = useRef(params.onReconnected);
  const onLeaveRoomRef = useRef(params.onLeaveRoom);
  const assertRecordingConsentRef = useRef(params.assertRecordingConsent);

  onDataReceivedRef.current = params.onDataReceived;
  onReconnectedRef.current = params.onReconnected;
  onLeaveRoomRef.current = params.onLeaveRoom;
  assertRecordingConsentRef.current = params.assertRecordingConsent;

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
      dispatch({ type: "health", health: "disconnected", message: "Disconnected from studio" });
    };

    const onReconnecting = () => {
      dispatch({ type: "health", health: "reconnecting", message: "Reconnecting..." });
    };

    const onReconnected = () => {
      dispatch({ type: "health", health: "connected", message: "" });
      onReconnectedRef.current();
    };

    (async () => {
      try {
        dispatch({ type: "connecting" });
        room.on(RoomEvent.DataReceived, handleData);
        room.on(RoomEvent.Disconnected, onDisconnected);
        room.on(RoomEvent.Reconnecting, onReconnecting);
        room.on(RoomEvent.Reconnected, onReconnected);

        await room.connect(config.getConfig("liveKitUrl"), token);
        if (cancelled) return;

        dispatch({ type: "connected" });

        if (params.videoEnabled) await room.localParticipant.setCameraEnabled(true);
        if (params.audioEnabled) await room.localParticipant.setMicrophoneEnabled(true);
        if (params.screenShareEnabled) await room.localParticipant.setScreenShareEnabled(true);

        recorderManager.current = new RecorderManager({
          room,
          assertRecordingConsent: () =>
            assertRecordingConsentRef.current?.() ?? Promise.resolve(true),
        });
      } catch (err: unknown) {
        if (cancelled) return;
        dispatch({
          type: "error",
          error: err instanceof Error ? err.message : "Failed to connect to studio",
        });
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      const activeRecorder = recorderManager.current;
      recorderManager.current = null;
      activeRecorder?.cleanup();
      void room.disconnect();
    };
  }, [
    token,
    params.enabled,
    params.audioEnabled,
    params.videoEnabled,
    params.screenShareEnabled,
    params.room,
  ]);

  const roomDbId = params.roomDbId;
  useEffect(() => {
    const leaveRoom = onLeaveRoomRef.current;
    return () => {
      if (roomDbId) leaveRoom(roomDbId);
    };
  }, [roomDbId]);

  const phase: StudioConnectionPhase = !params.enabled
    ? "idle"
    : tokenIsLoading || connection.phase === "connecting"
      ? "loading"
      : tokenIsError || connection.phase === "error"
        ? "error"
        : connection.phase === "connected"
          ? "connected"
          : "idle";

  const error = tokenError ? tokenError.message : connection.error;

  const setConnectionMessage = (message: string) => {
    dispatch({ type: "health", health: connection.health, message });
  };

  return {
    phase,
    error,
    connectionHealth: connection.health,
    connectionMessage: connection.message,
    setConnectionMessage,
    recorderManager,
  };
}
