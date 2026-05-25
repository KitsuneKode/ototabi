"use client";

import { ControlBar, RoomAudioRenderer, RoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@ototabi/ui/components/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Room, RoomOptions, VideoPresets } from "livekit-client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import type { RecorderManager } from "@/lib/recorder/recorder-manager";

import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { StudioShell } from "@/components/layout/studio-shell";
import { StudioChatPanel } from "@/components/studio/studio-chat-panel";
import { StudioParticipantRoster } from "@/components/studio/studio-participant-roster";
import { StudioVideoGrid } from "@/components/studio/studio-video-grid";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { KeyboardShortcutsOverlay } from "@/components/ui/keyboard-shortcuts-overlay";
import { Led, LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatTimer } from "@/lib/date-utils";
import { formatParticipantLabel } from "@/lib/guest-display";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useStudioConnection } from "@/lib/hooks/use-studio-connection";
import { useTimer } from "@/lib/hooks/use-timer";
import { ArrowLeft, CheckCircle, AlertTriangle, Radio, PanelRight } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";
export default function StudioPage() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();

  const audioEnabled = searchParams.get("audioEnabled") === "true";
  const videoEnabled = searchParams.get("videoEnabled") === "true";
  const screenShareEnabled = searchParams.get("screenShareEnabled") === "true";
  const inviteToken = searchParams.get("invite") || "";
  const micId = searchParams.get("micId") || "";
  const camId = searchParams.get("camId") || "";

  const quality = (searchParams.get("quality") as "720p" | "1080p" | "4k") || "720p";

  const qualityPresets: Record<
    string,
    { resolution: { width: number; height: number }; maxBitrate: number }
  > = {
    "720p": { resolution: VideoPresets.h720.resolution, maxBitrate: 1_200_000 },
    "1080p": { resolution: VideoPresets.h1080.resolution, maxBitrate: 2_500_000 },
    "4k": { resolution: VideoPresets.h2160.resolution, maxBitrate: 5_000_000 },
  };
  const qualityConfig = qualityPresets[quality] || qualityPresets["720p"]!;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<
    Map<string, { name: string; progress: number; type: string }>
  >(new Map());
  const [sidebarTab, setSidebarTab] = useState<"uploads" | "chat">("uploads");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSessionIdRef = useRef<string | null>(null);

  const recordingSeconds = useTimer(isRecording);

  const authState = useQuery(trpc.auth.getSession.queryOptions());
  const sessionUser = authState.data?.user;
  const sessionRole = authState.data?.user?.role;
  const operatorLabel = sessionUser
    ? formatParticipantLabel({
        name: sessionUser.name,
        email: sessionUser.email,
        isLocalGuest: sessionRole === "guest",
      })
    : "";

  const roomInfo = useQuery(
    trpc.rooms.getRoom.queryOptions({ code: roomId }, { enabled: !!roomId }),
  );
  const roomDetails = roomInfo.data;

  const startSessionMutation = useMutation(trpc.rooms.startRecordingSession.mutationOptions());
  const stopSessionMutation = useMutation(trpc.rooms.stopRecordingSession.mutationOptions());
  const leaveRoomMutation = useMutation(trpc.rooms.leaveRoom.mutationOptions());
  const createEventMutation = useMutation(trpc.recordingEvents.create.mutationOptions());
  const submitSyncMarkerMutation = useMutation(trpc.syncMarkers.submit.mutationOptions());

  const leaveRoomMutateRef = useRef(leaveRoomMutation.mutate);
  const createEventMutateRef = useRef(createEventMutation.mutate);
  const submitSyncMarkerMutateRef = useRef(submitSyncMarkerMutation.mutate);
  const recorderManagerRef = useRef<{ current: RecorderManager | null } | null>(null);
  leaveRoomMutateRef.current = leaveRoomMutation.mutate;
  createEventMutateRef.current = createEventMutation.mutate;
  submitSyncMarkerMutateRef.current = submitSyncMarkerMutation.mutate;

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const room = useRef(
    new Room({
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
    } as RoomOptions),
  ).current;

  useEffect(() => {
    if (!isRecording || isPaused || !activeSessionId) return;

    const publishMarker = () => {
      const localTime = performance.now();
      submitSyncMarkerMutateRef.current({
        sessionId: activeSessionId,
        localTime,
      });
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "sync_marker", localTime, sessionId: activeSessionId }),
      );
      room.localParticipant.publishData(payload, { reliable: false }).catch(() => undefined);
    };

    publishMarker();
    const intervalId = window.setInterval(publishMarker, 2000);
    return () => window.clearInterval(intervalId);
  }, [isRecording, isPaused, activeSessionId, room]);

  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: { identity?: string }) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "start_recording") {
          setActiveSessionId(data.sessionId);
          setIsRecording(true);
          void recorderManagerRef.current?.current?.startRecording(data.sessionId);
        } else if (data.type === "stop_recording") {
          setIsRecording(false);
          void recorderManagerRef.current?.current?.stopRecording();
        } else if (data.type === "upload_progress") {
          setProgressMap((prev) => {
            const next = new Map(prev);
            next.set(data.trackSid, {
              name: participant?.identity || "Guest",
              progress: data.progress,
              type: data.trackSid.includes("video") ? "VIDEO" : "AUDIO",
            });
            return next;
          });
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [],
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
  });

  const recorderManager = connection.recorderManager;
  recorderManagerRef.current = recorderManager;
  const connectionHealth = connection.connectionHealth;
  const connectionError = connection.connectionMessage || connection.error;

  const handleStartRecording = async () => {
    if (!roomDetails) return;
    try {
      const session = await startSessionMutation.mutateAsync({
        roomId: roomDetails.id,
      });
      setActiveSessionId(session.id);
      setIsRecording(true);
      setIsPaused(false);
      await recorderManager.current?.startRecording(session.id);

      const data = new TextEncoder().encode(
        JSON.stringify({ type: "start_recording", sessionId: session.id }),
      );
      await room.localParticipant.publishData(data, { reliable: true });
    } catch (e) {
      console.error("Failed starting recording:", e);
    }
  };

  const handleStopRecording = async () => {
    if (!activeSessionId) return;
    try {
      await stopSessionMutation.mutateAsync({ sessionId: activeSessionId });
      setIsRecording(false);
      setIsPaused(false);
      await recorderManager.current?.stopRecording();

      const data = new TextEncoder().encode(JSON.stringify({ type: "stop_recording" }));
      await room.localParticipant.publishData(data, { reliable: true });
    } catch (e) {
      console.error("Failed stopping recording:", e);
    }
  };

  const isHost = roomDetails && sessionUser && roomDetails.creatorId === sessionUser.id;

  useKeyboardShortcuts({
    toggleRecording: () => (isRecording ? handleStopRecording() : handleStartRecording()),
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

  // ─── Auth Gate ──────────────────────────────────────────────────────────
  if (!authState.isLoading && !authState.data) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
          <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
            Authentication Required
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            You must be signed in to access the studio.
          </p>
          <MechButton onClick={() => router.push("/auth/signin")} className="w-full justify-center">
            Sign In
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────
  if (connection.phase === "error" || connection.error) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <div className="bg-led-on/10 border-led-on/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
            <AlertTriangle className="text-led-on h-6 w-6" />
          </div>
          <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
            Connection Fault
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            {connectionError}
          </p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (connection.phase !== "connected" || !roomDetails || !sessionUser) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <div className="space-y-1 text-center">
            <span className="block animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
              Synchronizing Studio Link...
            </span>
            <AnalogInset className="mx-auto h-1.5 w-48">
              <div className="bg-accent/60 h-full w-2/3 animate-pulse rounded" />
            </AnalogInset>
          </div>
        </div>
      </div>
    );
  }

  // ─── Studio Main UI ──────────────────────────────────────────────────────────
  return (
    <RoomContext.Provider value={room}>
      <StudioShell>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 px-3 py-3 shadow-[0_4px_0_0_var(--color-border)] sm:px-5">
          <div className="flex items-center gap-4">
            <MechButton
              onClick={() => router.push("/dashboard")}
              aria-label="Return to Dashboard"
              className="focus-visible:ring-accent h-9 w-9 focus-visible:ring-2 focus-visible:outline-none"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-foreground text-sm leading-none font-bold tracking-wide uppercase">
                Studio: <span className="text-muted-foreground">{roomDetails.name}</span>
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5">
                <MonoLabel>
                  Join Code: <span className="text-foreground">{roomDetails.code}</span>
                  {" | "}Op: {operatorLabel}
                </MonoLabel>
                {isHost && (
                  <StatusBadge variant="ok" className="text-[8px]">
                    <LedInline color="green" size="sm" />
                    HOST
                  </StatusBadge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile sidebar toggle */}
            <MechButton
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label="Toggle participants panel"
              title="Participants"
              className="focus-visible:ring-accent h-9 w-9 focus-visible:ring-2 focus-visible:outline-none md:hidden"
            >
              <PanelRight className="h-4 w-4" />
            </MechButton>

            {/* Connection health LED */}
            <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
              <Led
                color={
                  connectionHealth === "connected"
                    ? "green"
                    : connectionHealth === "reconnecting"
                      ? "amber"
                      : "red"
                }
                size="sm"
                pulse={connectionHealth === "reconnecting"}
              />
              <MonoLabel>
                {connectionHealth === "connected"
                  ? "LIVE"
                  : connectionHealth === "reconnecting"
                    ? "SYNC"
                    : "LOST"}
              </MonoLabel>
            </AnalogInset>

            {connectionError && (
              <div className="flex items-center gap-1.5 rounded border border-yellow-600/40 bg-yellow-400/10 px-3 py-1.5">
                <MonoLabel className="text-yellow-600 dark:text-yellow-400">
                  {connectionError}
                </MonoLabel>
              </div>
            )}

            {isRecording && (
              <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
                <Led color={isPaused ? "amber" : "red"} size="sm" pulse={!isPaused} />
                <MonoLabel className="text-led-on tabular-nums">
                  {isPaused ? "PAUSED" : "REC"} · {formatTimer(recordingSeconds)}
                </MonoLabel>
              </AnalogInset>
            )}

            {isHost && (
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    className="btn-mechanical text-secondary-foreground h-9 rounded px-5 text-[10px] font-bold tracking-widest uppercase"
                  >
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        if (isPaused) {
                          recorderManager.current?.resumeRecording();
                          if (activeSessionId) {
                            createEventMutateRef.current({
                              sessionId: activeSessionId,
                              type: "RESUME",
                              message: "Recording resumed",
                            });
                          }
                          setIsPaused(false);
                        } else {
                          recorderManager.current?.pauseRecording();
                          if (activeSessionId) {
                            createEventMutateRef.current({
                              sessionId: activeSessionId,
                              type: "PAUSE",
                              message: "Recording paused",
                            });
                          }
                          setIsPaused(true);
                        }
                      }}
                      className="btn-mechanical text-secondary-foreground h-9 rounded px-4 text-[10px] font-bold tracking-widest uppercase"
                    >
                      {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      className="bg-led-on/90 hover:bg-led-on border-led-on/60 h-9 rounded border px-5 text-[10px] font-bold tracking-widest text-white uppercase shadow-[0_3px_5px_rgba(0,0,0,0.2),0_0_10px_var(--color-led-on)] transition-[transform,box-shadow] duration-150 ease-[var(--ease-mechanical)] active:translate-y-[2px]"
                    >
                      Stop
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {(isRecording || connectionHealth !== "connected") && (
          <div className="border-border shrink-0 border-b px-4 py-2 md:px-5">
            <SessionStatusRail
              isRecording={isRecording}
              isPaused={isPaused}
              uploadStatus={isRecording ? "recording" : undefined}
              syncOk={connectionHealth === "connected"}
            />
          </div>
        )}

        {/* ── Main Layout ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video feed area */}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#111] will-change-transform">
            {/* CRT scanline overlay on the entire video area */}
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-20 will-change-transform"
              style={{
                background: "linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%)",
                backgroundSize: "100% 4px",
              }}
            />

            {/* Corner label */}
            <div className="absolute top-3 left-3 z-20 rounded border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] tracking-widest text-[#888] uppercase">
              CH 1 : Studio Feed
            </div>

            <div className="flex min-h-0 w-full flex-1 items-center justify-center p-3 md:p-4">
              <StudioVideoGrid />
            </div>
            <RoomAudioRenderer />
          </main>

          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
          )}

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
          <aside
            className={`border-border bg-card flex-col overflow-y-auto border-l-2 shadow-[-4px_0_0_0_var(--color-border)] ${
              sidebarOpen ? "fixed inset-y-0 right-0 z-30 flex w-72" : "hidden"
            } md:relative md:z-auto md:flex md:w-72`}
          >
            {/* Tab bar */}
            <div className="border-border flex shrink-0 border-b">
              <button
                onClick={() => setSidebarTab("uploads")}
                className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  sidebarTab === "uploads"
                    ? "bg-popover text-foreground border-accent border-b-2"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Uploads
              </button>
              <button
                onClick={() => setSidebarTab("chat")}
                className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  sidebarTab === "chat"
                    ? "bg-popover text-foreground border-accent border-b-2"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Chat
              </button>
            </div>

            <StudioParticipantRoster
              localUserName={sessionUser?.name ?? ""}
              localUserEmail={sessionUser?.email}
              localRole={sessionRole}
            />

            {sidebarTab === "uploads" ? (
              <div className="flex-1 overflow-y-auto p-4">
                {isHost ? (
                  <>
                    <PanelTitle
                      label="Track Upload Queues"
                      title="Upload Monitor"
                      className="border-border mb-4 border-b pb-3"
                    />

                    {progressMap.size === 0 ? (
                      <AnalogInset className="flex flex-col items-center justify-center gap-3 border-dashed p-6 text-center">
                        <Radio className="text-muted-foreground/30 h-8 w-8 animate-pulse" />
                        <div className="space-y-1">
                          <MonoLabel className="block">Standby Mode</MonoLabel>
                          <p className="text-muted-foreground/60 max-w-[160px] font-mono text-[8px] leading-normal uppercase">
                            Upload feeds populate once recorders activate.
                          </p>
                        </div>
                      </AnalogInset>
                    ) : (
                      <div className="space-y-3.5">
                        {Array.from(progressMap.entries()).map(([trackSid, data]) => (
                          <AnalogInset key={trackSid} className="p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-foreground max-w-[120px] truncate text-xs font-bold uppercase">
                                {data.name}
                              </span>
                              <StatusBadge className="text-[8px]">{data.type}</StatusBadge>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <AnalogInset className="h-2 flex-1 p-0">
                                <div
                                  className={`h-full rounded-sm transition-[width] duration-300 ${
                                    data.progress === 100
                                      ? "bg-led-green shadow-[0_0_5px_var(--color-led-green)]"
                                      : "bg-accent shadow-[0_0_5px_var(--color-accent-glow)]"
                                  }`}
                                  style={{ width: `${data.progress}%` }}
                                />
                              </AnalogInset>
                              <span className="text-foreground min-w-[32px] text-right font-mono text-[10px] font-bold tabular-nums">
                                {data.progress}%
                              </span>
                            </div>

                            <div className="text-muted-foreground/60 mt-2 flex items-center justify-between font-mono text-[8px]">
                              <span className="max-w-[140px] truncate uppercase">
                                SID: {trackSid.slice(-10)}
                              </span>
                              {data.progress === 100 && (
                                <span className="text-led-green flex items-center gap-0.5 font-bold">
                                  <CheckCircle className="h-3 w-3 shrink-0" />
                                  <span>SAVED</span>
                                </span>
                              )}
                            </div>
                          </AnalogInset>
                        ))}
                      </div>
                    )}
                  </>
                ) : progressMap.size > 0 ? (
                  <>
                    <PanelTitle
                      label="Your Tracks"
                      title="Upload Status"
                      className="border-border mb-4 border-b pb-3"
                    />
                    <div className="space-y-3.5">
                      {Array.from(progressMap.entries())
                        .filter(([, d]) => d.name === sessionUser?.name)
                        .map(([trackSid, data]) => (
                          <AnalogInset key={trackSid} className="p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <MonoLabel className="text-[8px]">{data.type}</MonoLabel>
                              {data.progress === 100 && (
                                <span className="text-led-green flex items-center gap-0.5 font-mono text-[8px] font-bold">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>DONE</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <AnalogInset className="h-2 flex-1 p-0">
                                <div
                                  className={`h-full rounded-sm transition-[width] duration-300 ${
                                    data.progress === 100 ? "bg-led-green" : "bg-accent"
                                  }`}
                                  style={{ width: `${data.progress}%` }}
                                />
                              </AnalogInset>
                              <span className="font-mono text-[10px] font-bold tabular-nums">
                                {data.progress}%
                              </span>
                            </div>
                          </AnalogInset>
                        ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <StudioChatPanel
                roomDbId={roomDetails.id}
                sessionUserName={sessionUser.name || sessionUser.email}
              />
            )}
          </aside>
        </div>

        {/* ── Control Footer ──────────────────────────────────────────────────── */}
        <footer className="border-border bg-card z-10 flex h-16 shrink-0 items-center justify-center border-t-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_0_0_var(--color-border)]">
          <ControlBar variation="minimal" />
        </footer>

        <KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </StudioShell>
    </RoomContext.Provider>
  );
}
