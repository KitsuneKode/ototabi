"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef } from "react";

import type { StudioQuality } from "@/lib/studio/quality-presets";

import { apiUrl } from "@/lib/api-base";
import { useRefreshAuthSession } from "@/lib/hooks/use-session";
import { isTrpcForbidden, isTrpcUnauthorized } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

type JoinMediaState = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedMic: string;
  selectedCam: string;
  micError: string;
  camError: string;
  stream: MediaStream | null;
  audioLevel: number;
  guestName: string;
  guestLoading: boolean;
  quality: StudioQuality;
};

type JoinMediaAction =
  | { type: "set_audio_enabled"; value: boolean }
  | { type: "set_video_enabled"; value: boolean }
  | { type: "toggle_screen_share" }
  | { type: "set_devices"; audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] }
  | { type: "set_selected_mic"; value: string }
  | { type: "set_selected_cam"; value: string }
  | { type: "set_mic_error"; value: string }
  | { type: "set_cam_error"; value: string }
  | { type: "set_stream"; value: MediaStream | null }
  | { type: "set_audio_level"; value: number }
  | { type: "set_guest_name"; value: string }
  | { type: "set_guest_loading"; value: boolean }
  | { type: "set_quality"; value: StudioQuality };

const initialMediaState: JoinMediaState = {
  audioEnabled: true,
  videoEnabled: true,
  screenShareEnabled: false,
  audioDevices: [],
  videoDevices: [],
  selectedMic: "",
  selectedCam: "",
  micError: "",
  camError: "",
  stream: null,
  audioLevel: 0,
  guestName: "",
  guestLoading: false,
  quality: "720p",
};

function joinMediaReducer(state: JoinMediaState, action: JoinMediaAction): JoinMediaState {
  switch (action.type) {
    case "set_audio_enabled":
      return { ...state, audioEnabled: action.value };
    case "set_video_enabled":
      return { ...state, videoEnabled: action.value };
    case "toggle_screen_share":
      return { ...state, screenShareEnabled: !state.screenShareEnabled };
    case "set_devices": {
      const next = {
        ...state,
        audioDevices: action.audio,
        videoDevices: action.video,
      };
      if (action.audio.length > 0 && !state.selectedMic && action.audio[0]) {
        next.selectedMic = action.audio[0].deviceId;
      }
      if (action.video.length > 0 && !state.selectedCam && action.video[0]) {
        next.selectedCam = action.video[0].deviceId;
      }
      return next;
    }
    case "set_selected_mic":
      return { ...state, selectedMic: action.value };
    case "set_selected_cam":
      return { ...state, selectedCam: action.value };
    case "set_mic_error":
      return { ...state, micError: action.value };
    case "set_cam_error":
      return { ...state, camError: action.value };
    case "set_stream":
      return { ...state, stream: action.value };
    case "set_audio_level":
      return { ...state, audioLevel: action.value };
    case "set_guest_name":
      return { ...state, guestName: action.value };
    case "set_guest_loading":
      return { ...state, guestLoading: action.value };
    case "set_quality":
      return { ...state, quality: action.value };
    default:
      return state;
  }
}

export function useJoinRoomPage(roomId: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const inviteToken = searchParams.get("invite") || undefined;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [media, dispatch] = useReducer(joinMediaReducer, initialMediaState);

  const refreshAuthSession = useRefreshAuthSession();
  const { data: authStateData } = useQuery(trpc.auth.getSession.queryOptions());
  const isSignedIn = !!authStateData?.user;
  const guestNeedsInvite = !isSignedIn && !inviteToken;

  const {
    data: roomInfoData,
    isLoading: roomInfoIsLoading,
    error: roomInfoError,
  } = useQuery(trpc.rooms.getRoomByCode.queryOptions({ code: roomId }, { enabled: !!roomId }));

  const { data: inviteInfoData, error: inviteInfoError } = useQuery(
    trpc.studioAccess.validateInvite.queryOptions(
      { code: roomId, token: inviteToken ?? "" },
      { enabled: !!roomId && !!inviteToken, retry: false },
    ),
  );

  const joinRoomMutation = useMutation(trpc.studioAccess.joinRoom.mutationOptions());

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices.filter((d) => d.kind === "audioinput");
      const video = devices.filter((d) => d.kind === "videoinput");
      dispatch({ type: "set_devices", audio, video });
    } catch {
      dispatch({ type: "set_mic_error", value: "Could not enumerate media devices" });
    }
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: true })
      .then((s) => {
        s.getTracks().forEach((t) => t.stop());
        enumerateDevices();
      })
      .catch(() => enumerateDevices());
  }, [enumerateDevices]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let animId: number;
    let audioCtx: AudioContext | null = null;

    const getMedia = async () => {
      try {
        if (!media.audioEnabled && !media.videoEnabled) {
          dispatch({ type: "set_stream", value: null });
          dispatch({ type: "set_audio_level", value: 0 });
          return;
        }

        const constraints: MediaStreamConstraints = {
          audio: media.audioEnabled
            ? media.selectedMic
              ? { deviceId: media.selectedMic }
              : true
            : false,
          video: media.videoEnabled
            ? media.selectedCam
              ? { deviceId: media.selectedCam }
              : true
            : false,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        dispatch({ type: "set_stream", value: mediaStream });
        if (videoRef.current) videoRef.current.srcObject = mediaStream;

        if (media.audioEnabled && mediaStream.getAudioTracks().length > 0) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const src = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            dispatch({
              type: "set_audio_level",
              value: Math.min(Math.round((avg / 80) * 100), 100),
            });
            animId = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        if (media.audioEnabled) {
          dispatch({ type: "set_mic_error", value: "Microphone permission or device error" });
        }
        if (media.videoEnabled) {
          dispatch({ type: "set_cam_error", value: "Camera permission or device error" });
        }
      }
    };

    getMedia();
    return () => {
      activeStream?.getTracks().forEach((t) => t.stop());
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx?.state !== "closed") audioCtx?.close();
    };
  }, [media.audioEnabled, media.videoEnabled, media.selectedMic, media.selectedCam]);

  const joinRoom = useCallback(async () => {
    dispatch({ type: "set_mic_error", value: "" });

    if (guestNeedsInvite) {
      dispatch({
        type: "set_mic_error",
        value: "Ask the host for an invite link (it includes ?invite= in the URL).",
      });
      return;
    }

    if (!isSignedIn) {
      if (!media.guestName.trim()) return;
      dispatch({ type: "set_guest_loading", value: true });
      try {
        const resp = await fetch(apiUrl("/api/guest-auth"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: media.guestName.trim() }),
        });
        if (!resp.ok) throw new Error("Guest sign-in failed");
        await refreshAuthSession();
      } catch {
        dispatch({ type: "set_mic_error", value: "Failed to create guest session" });
        dispatch({ type: "set_guest_loading", value: false });
        return;
      }
      dispatch({ type: "set_guest_loading", value: false });
    }

    try {
      await joinRoomMutation.mutateAsync({ code: roomId, inviteToken });
    } catch (error) {
      if (isTrpcUnauthorized(error)) {
        dispatch({
          type: "set_mic_error",
          value: "Session expired. Re-enter your name and try again.",
        });
      } else if (isTrpcForbidden(error)) {
        dispatch({
          type: "set_mic_error",
          value: "This room requires a valid invite link from the host.",
        });
      } else {
        dispatch({ type: "set_mic_error", value: "Failed to verify room access" });
      }
      return;
    }

    const params = new URLSearchParams({
      audioEnabled: String(media.audioEnabled),
      videoEnabled: String(media.videoEnabled),
      screenShareEnabled: String(media.screenShareEnabled),
      quality: media.quality,
      micId: media.selectedMic,
      camId: media.selectedCam,
    });
    if (inviteToken) params.set("invite", inviteToken);
    router.push(`/chat/${roomId}/preflight?${params.toString()}`);
  }, [
    media.audioEnabled,
    media.videoEnabled,
    media.screenShareEnabled,
    media.quality,
    media.selectedMic,
    media.selectedCam,
    media.guestName,
    roomId,
    inviteToken,
    router,
    isSignedIn,
    guestNeedsInvite,
    joinRoomMutation,
    refreshAuthSession,
  ]);

  return {
    router,
    videoRef,
    media,
    dispatch,
    isSignedIn,
    guestNeedsInvite,
    roomInfoData,
    roomInfoIsLoading,
    roomInfoError,
    inviteInfoData,
    inviteInfoError,
    joinRoom,
  };
}
