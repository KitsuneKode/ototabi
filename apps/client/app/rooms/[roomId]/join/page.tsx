"use client";

import { Label } from "@ototabi/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";

import { JoinShell } from "@/components/layout/join-shell";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { apiUrl } from "@/lib/api-base";
import { formatDateTime } from "@/lib/date-utils";
import { useRefreshAuthSession } from "@/lib/hooks/use-session";
import { Mic, ArrowRight, Info, AlertTriangle, RefreshCw, VideoOff, Tv, User } from "@/lib/icons";
import { isTrpcForbidden, isTrpcUnauthorized } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

function RoomJoinPageContent() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const inviteToken = searchParams.get("invite") || undefined;

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCam, setSelectedCam] = useState("");
  const [micError, setMicError] = useState("");
  const [camError, setCamError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [quality, setQuality] = useState<"720p" | "1080p" | "4k">("720p");

  const refreshAuthSession = useRefreshAuthSession();
  const authState = useQuery(trpc.auth.getSession.queryOptions());
  const isSignedIn = !!authState.data?.user;
  const guestNeedsInvite = !isSignedIn && !inviteToken;

  const roomInfo = useQuery(
    trpc.rooms.getRoomByCode.queryOptions({ code: roomId }, { enabled: !!roomId }),
  );
  const inviteInfo = useQuery(
    trpc.rooms.validateInvite.queryOptions(
      { code: roomId, token: inviteToken ?? "" },
      { enabled: !!roomId && !!inviteToken, retry: false },
    ),
  );
  const joinRoomMutation = useMutation(trpc.rooms.joinRoom.mutationOptions());

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices.filter((d) => d.kind === "audioinput");
      const video = devices.filter((d) => d.kind === "videoinput");
      setAudioDevices(audio);
      setVideoDevices(video);
      if (audio.length > 0 && !selectedMic && audio[0]) setSelectedMic(audio[0].deviceId);
      if (video.length > 0 && !selectedCam && video[0]) setSelectedCam(video[0].deviceId);
    } catch {
      setMicError("Could not enumerate media devices");
    }
  }, [selectedMic, selectedCam]);

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
        if (!audioEnabled && !videoEnabled) {
          setStream(null);
          setAudioLevel(0);
          return;
        }

        const constraints: MediaStreamConstraints = {
          audio: audioEnabled ? (selectedMic ? { deviceId: selectedMic } : true) : false,
          video: videoEnabled ? (selectedCam ? { deviceId: selectedCam } : true) : false,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;

        if (audioEnabled && mediaStream.getAudioTracks().length > 0) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const src = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setAudioLevel(Math.min(Math.round((avg / 80) * 100), 100));
            animId = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        if (audioEnabled) setMicError("Microphone permission or device error");
        if (videoEnabled) setCamError("Camera permission or device error");
      }
    };

    getMedia();
    return () => {
      activeStream?.getTracks().forEach((t) => t.stop());
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx?.state !== "closed") audioCtx?.close();
    };
  }, [audioEnabled, videoEnabled, selectedMic, selectedCam]);

  const joinRoom = useCallback(async () => {
    setMicError("");

    if (guestNeedsInvite) {
      setMicError("Ask the host for an invite link (it includes ?invite= in the URL).");
      return;
    }

    if (!isSignedIn) {
      if (!guestName.trim()) return;
      setGuestLoading(true);
      try {
        const resp = await fetch(apiUrl("/api/guest-auth"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: guestName.trim() }),
        });
        if (!resp.ok) throw new Error("Guest sign-in failed");
        await refreshAuthSession();
      } catch {
        setMicError("Failed to create guest session");
        setGuestLoading(false);
        return;
      }
      setGuestLoading(false);
    }

    try {
      await joinRoomMutation.mutateAsync({ code: roomId, inviteToken });
    } catch (error) {
      if (isTrpcUnauthorized(error)) {
        setMicError("Session expired. Re-enter your name and try again.");
      } else if (isTrpcForbidden(error)) {
        setMicError("This room requires a valid invite link from the host.");
      } else {
        setMicError("Failed to verify room access");
      }
      return;
    }

    const params = new URLSearchParams({
      audioEnabled: String(audioEnabled),
      videoEnabled: String(videoEnabled),
      screenShareEnabled: String(screenShareEnabled),
      quality,
      micId: selectedMic,
      camId: selectedCam,
    });
    if (inviteToken) params.set("invite", inviteToken);
    router.push(`/chat/${roomId}?${params.toString()}`);
  }, [
    audioEnabled,
    videoEnabled,
    screenShareEnabled,
    quality,
    selectedMic,
    selectedCam,
    roomId,
    inviteToken,
    router,
    isSignedIn,
    guestName,
    guestNeedsInvite,
    joinRoomMutation,
    refreshAuthSession,
  ]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (roomInfo.isLoading) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="text-accent h-8 w-8 animate-spin" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Engaging Calibration Sequence...
          </span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (roomInfo.error || !roomInfo.data || inviteInfo.error) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-md p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
          <p className="text-led-on mb-2 text-lg font-bold tracking-wider uppercase">
            Reel Not Located
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            The studio join code or invite link is unrecognized, revoked, or expired.
          </p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Back to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  return (
    <JoinShell
      title="Studio Join"
      subtitle={`Room: ${roomInfo.data.name} // Pre-flight calibration`}
    >
      <AnalogCard className="flex flex-col gap-8 overflow-hidden p-6 md:grid md:grid-cols-12 md:p-8">
        {/* ── Left: CRT Live Preview Panel ────────────────────────────── */}
        <div className="bg-popover border-border flex min-h-[320px] flex-col justify-between rounded border p-5 shadow-inner md:col-span-7 md:min-h-[440px]">
          <div className="space-y-4">
            {/* Panel header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LedInline color="green" pulse />
                <MonoLabel>CH 1 : CALIBRATION</MonoLabel>
              </div>
              <MonoLabel className="bg-card/60 border-border rounded border px-2 py-0.5">
                Room: {roomInfo.data.name}
              </MonoLabel>
            </div>

            {guestNeedsInvite ? (
              <AnalogInset className="border-led-on/30 p-3">
                <MonoLabel className="text-led-on block">INVITE LINK REQUIRED</MonoLabel>
                <MonoLabel className="mt-1 block text-[9px] leading-relaxed">
                  Ask the host to share their studio invite from Room Settings. Plain room codes are
                  not enough for guest access.
                </MonoLabel>
              </AnalogInset>
            ) : null}

            {inviteInfo.data ? (
              <AnalogInset className="p-3">
                <MonoLabel className="text-accent block">SECURE INVITE VERIFIED</MonoLabel>
                <MonoLabel className="mt-1 block text-[9px]">
                  ROLE: {inviteInfo.data.role.toUpperCase()}
                  {inviteInfo.data.expiresAt
                    ? ` // EXPIRES: ${formatDateTime(inviteInfo.data.expiresAt)}`
                    : " // NO EXPIRY"}
                </MonoLabel>
              </AnalogInset>
            ) : null}

            {/* CRT video display */}
            <div className="scanlines relative flex aspect-video w-full items-center justify-center overflow-hidden rounded border-4 border-[#1a1a1a] bg-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {videoEnabled && stream?.getVideoTracks().length ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="relative z-10 h-full w-full scale-x-[-1] object-cover"
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center space-y-2 p-6 text-center">
                  <div className="bg-card/30 border-border text-muted-foreground/60 rounded-full border p-3">
                    <VideoOff className="h-8 w-8" />
                  </div>
                  <p className="text-muted-foreground/60 font-mono text-xs font-bold uppercase">
                    CAMERA DIAL DISENGAGED
                  </p>
                </div>
              )}
              {/* Status overlay */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded border border-white/10 bg-black/80 px-2 py-0.5 font-mono text-[8px] text-zinc-300">
                <LedInline color={videoEnabled ? "green" : "red"} size="sm" />
                FEED: {videoEnabled ? "ACTIVE" : "MUTED"}
              </div>
            </div>
          </div>

          {/* Audio level meter */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <MonoLabel className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> MIC AUDIO LEVEL
              </MonoLabel>
              <MonoLabel className={audioLevel > 50 ? "text-accent" : ""}>{audioLevel}%</MonoLabel>
            </div>
            <AnalogInset className="flex h-3 items-stretch p-0.5">
              <div
                className="rounded-sm transition-[width] duration-75"
                style={{
                  width: `${audioEnabled ? audioLevel : 0}%`,
                  backgroundColor: "var(--color-led-on)",
                  boxShadow:
                    audioEnabled && audioLevel > 0 ? "0 0 5px var(--color-led-on)" : "none",
                }}
              />
            </AnalogInset>
            <MonoLabel className="text-[9px] leading-normal">
              Establish modulation peak verification before studio connection.
            </MonoLabel>
          </div>
        </div>

        {/* ── Right: Setup Controls ─────────────────────────────────── */}
        <div className="flex flex-col justify-between md:col-span-5">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase">Console Settings</h2>
              <MonoLabel className="mt-0.5 block">Configure your deck inputs</MonoLabel>
            </div>

            {/* Mic Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="mic-select"
                  className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
                >
                  Microphone Input
                </Label>
                <button
                  onClick={() => setAudioEnabled((v) => !v)}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-[background-color,border-color] ${
                    audioEnabled
                      ? "bg-led-green/10 text-led-green border-led-green/30"
                      : "bg-led-on/10 text-led-on border-led-on/30"
                  }`}
                >
                  {audioEnabled ? "ENGAGED" : "MUTED"}
                </button>
              </div>
              {audioEnabled ? (
                <select
                  id="mic-select"
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="border-border bg-popover text-foreground focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-xs shadow-inner focus:ring-1 focus:outline-none"
                >
                  {audioDevices.length === 0 ? (
                    <option value="">Searching for devices...</option>
                  ) : (
                    audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <AnalogInset className="flex h-10 items-center justify-center border-dashed">
                  <MonoLabel className="text-[10px]">Mic Stream Terminated</MonoLabel>
                </AnalogInset>
              )}
              {micError && <MonoLabel className="text-led-on text-[9px]">{micError}</MonoLabel>}
            </div>

            {/* Camera Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="cam-select"
                  className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
                >
                  Camera Source
                </Label>
                <button
                  onClick={() => setVideoEnabled((v) => !v)}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-[background-color,border-color] ${
                    videoEnabled
                      ? "bg-led-green/10 text-led-green border-led-green/30"
                      : "bg-led-on/10 text-led-on border-led-on/30"
                  }`}
                >
                  {videoEnabled ? "ENGAGED" : "MUTED"}
                </button>
              </div>
              {videoEnabled ? (
                <select
                  id="cam-select"
                  value={selectedCam}
                  onChange={(e) => setSelectedCam(e.target.value)}
                  className="border-border bg-popover text-foreground focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-xs shadow-inner focus:ring-1 focus:outline-none"
                >
                  {videoDevices.length === 0 ? (
                    <option value="">Searching for devices...</option>
                  ) : (
                    videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <AnalogInset className="flex h-10 items-center justify-center border-dashed">
                  <MonoLabel className="text-[10px]">Camera Stream Terminated</MonoLabel>
                </AnalogInset>
              )}
              {camError && <MonoLabel className="text-led-on text-[9px]">{camError}</MonoLabel>}
            </div>

            {/* Recording Quality */}
            <div className="space-y-2">
              <Label
                htmlFor="quality-select"
                className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
              >
                Recording Quality
              </Label>
              <select
                id="quality-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value as "720p" | "1080p" | "4k")}
                className="border-border bg-popover text-foreground focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-xs shadow-inner focus:ring-1 focus:outline-none"
              >
                <option value="720p">720p HD (1280×720)</option>
                <option value="1080p">1080p Full HD (1920×1080)</option>
                <option value="4k">4K UHD (3840×2160)</option>
              </select>
            </div>

            {/* Screen Share Toggle */}
            <div className="space-y-2 pt-1">
              <MonoLabel className="block">Additional Feeds</MonoLabel>
              <button
                onClick={() => setScreenShareEnabled((v) => !v)}
                className={`flex h-10 w-full items-center justify-between rounded border px-3 font-mono text-xs font-bold tracking-wider uppercase transition-[border-color,background-color] ${
                  screenShareEnabled
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tv className="h-4 w-4" />
                  <span>Screen Capture Link</span>
                </div>
                <div
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${screenShareEnabled ? "bg-accent border-accent" : "bg-popover border-border"}`}
                >
                  {screenShareEnabled && <div className="h-1.5 w-1.5 rounded-sm bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* Join Button */}
          <div className="border-border mt-6 space-y-4 border-t pt-6">
            {!isSignedIn && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <Label
                    htmlFor="guest-name"
                    className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
                  >
                    Your Name
                  </Label>
                </div>
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name to join..."
                  className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-sm shadow-inner focus:ring-1 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && guestName.trim()) joinRoom();
                  }}
                />
              </div>
            )}
            <MechButton
              onClick={joinRoom}
              disabled={guestNeedsInvite || (!isSignedIn && (!guestName.trim() || guestLoading))}
              className="h-12 w-full justify-center gap-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guestLoading ? (
                <span>Creating Guest Session...</span>
              ) : (
                <>
                  <span>{isSignedIn ? "Connect Studio Deck" : "Join as Guest"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </MechButton>
            <div className="text-muted-foreground flex items-start gap-2 font-mono text-[9px] leading-relaxed uppercase">
              <Info className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                By joining, you authorize Ototabi to buffer your high-quality tracks inside a secure
                local IndexedDB container for uploading.
              </span>
            </div>
          </div>
        </div>
      </AnalogCard>
    </JoinShell>
  );
}

function RoomJoinPageFallback() {
  return (
    <JoinShell title="Join session" subtitle="Loading invite and device console…">
      <AnalogCard className="p-8">
        <MonoLabel>Preparing join surface…</MonoLabel>
      </AnalogCard>
    </JoinShell>
  );
}

export default function RoomJoinPage() {
  return (
    <Suspense fallback={<RoomJoinPageFallback />}>
      <RoomJoinPageContent />
    </Suspense>
  );
}
