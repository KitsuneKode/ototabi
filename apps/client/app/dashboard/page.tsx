"use client";

import { authClient } from "@ototabi/auth/client";
import { Button } from "@ototabi/ui/components/button";
import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Copy,
  Plus,
  Video,
  LogOut,
  Calendar,
  Clock,
  Settings as SettingsIcon,
  Search,
  Sliders,
  FolderOpen,
  Film,
  ExternalLink,
  Lock,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import {
  MonoLabel,
  PanelTitle,
  StatusBadge,
  NoiseBackground,
  MechButton,
} from "@/components/ui/retro-primitives";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";
import { useTRPC } from "@/trpc/client";

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const authState = useQuery(trpc.auth.getSession.queryOptions());
  const roomsList = useQuery(trpc.rooms.listRooms.queryOptions());
  const sharedRooms = useQuery(trpc.rooms.listSharedRooms.queryOptions());

  const createRoomMutation = useMutation(
    trpc.rooms.createRoom.mutationOptions({
      onSuccess: () => {
        setNewRoomName("");
        roomsList.refetch();
      },
    }),
  );

  const recordingSessions = useQuery(
    trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: selectedRoomId || "" },
      { enabled: !!selectedRoomId },
    ),
  );

  const recentSessions = useQuery(trpc.rooms.listRecentSessions.queryOptions());

  const handleCreateRoom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRoomName.trim()) return;
      createRoomMutation.mutate({ name: newRoomName.trim() });
    },
    [newRoomName, createRoomMutation],
  );

  const handleCopyLink = useCallback((code: string) => {
    const link = `${window.location.origin}/rooms/${code}/join`;
    navigator.clipboard.writeText(link);
    setCopiedRoomCode(code);
    setTimeout(() => setCopiedRoomCode(null), 2000);
  }, []);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push("/");
  }, [router]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authState.isLoading) {
    return (
      <div className="bg-background text-foreground relative flex min-h-screen flex-col overflow-x-hidden p-4 font-sans md:p-8">
        <NoiseBackground />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-8">
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
            <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
              Initializing Dashboard Console...
            </span>
          </div>

          {/* Skeleton cards */}
          <header className="border-border flex flex-col items-start justify-between gap-4 border-b-2 pb-4 md:flex-row md:items-end">
            <div className="space-y-3">
              <div className="bg-card border-border h-10 w-64 animate-pulse rounded border" />
              <div className="bg-card border-border h-4 w-48 animate-pulse rounded border" />
            </div>
            <div className="flex gap-3">
              <div className="bg-card border-border h-8 w-32 animate-pulse rounded border" />
              <div className="bg-card border-border h-8 w-28 animate-pulse rounded border" />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="flex flex-col gap-6 md:col-span-5">
              <div className="bg-card border-border h-64 animate-pulse rounded-lg border" />
              <div className="bg-card border-border h-80 animate-pulse rounded-lg border" />
            </div>
            <div className="md:col-span-7">
              <div className="bg-card border-border h-[480px] animate-pulse rounded-lg border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!authState.data?.user) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <div className="bg-led-on/10 border-led-on/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
            <Lock className="text-led-on h-5 w-5" />
          </div>
          <p className="text-led-on mb-2 font-sans text-sm font-bold tracking-wider uppercase">
            System Access Gated
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            Authenticate to establish console link.
          </p>
          <MechButton onClick={() => router.push("/")} className="w-full">
            Authenticate
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const selectedRoom = [...(roomsList.data ?? []), ...(sharedRooms.data ?? [])].find(
    (r) => r.id === selectedRoomId,
  );
  const allRooms = [
    ...(roomsList.data?.map((r) => ({ ...r, _shared: false })) ?? []),
    ...(sharedRooms.data?.map((r) => ({ ...r, _shared: true })) ?? []),
  ];
  const filteredRooms = allRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col overflow-x-hidden p-4 font-sans md:p-8">
      <NoiseBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="border-border flex flex-col items-start justify-between gap-4 border-b-2 pb-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl leading-none font-bold tracking-tight uppercase">Dashboard</h1>
            <MonoLabel className="mt-1.5 block">Model 16-A // Host Room Controller Board</MonoLabel>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* User tag */}
            <div className="bg-card border-border flex items-center gap-2 rounded border px-3 py-1.5 shadow-sm">
              <Led color="amber" size="sm" pulse />
              <MonoLabel>
                <span className="text-muted-foreground mr-1">OP:</span>
                <span className="text-foreground font-bold">{authState.data.user.name}</span>
              </MonoLabel>
            </div>

            <MechButton onClick={() => router.push("/settings")}>
              <User className="h-3.5 w-3.5" />
              <span>Settings</span>
            </MechButton>

            <MechButton
              variant="danger"
              onClick={handleSignOut}
              className="text-destructive-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </MechButton>
          </div>
        </header>

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* ── Column 1: Create Room + Room List ───────────────────────── */}
          <div className="flex flex-col gap-6 md:col-span-5">
            {/* Create Room */}
            <AnalogCard className="p-4 md:p-6">
              <MonoLabel className="mb-1 block">Sequence Config</MonoLabel>
              <h2 className="mb-4 text-xl font-bold tracking-tight uppercase">Initialize Room</h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="room-name"
                    className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase"
                  >
                    Room Name
                  </Label>
                  <Input
                    id="room-name"
                    type="text"
                    required
                    placeholder="e.g., Podcast Episode 01"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-10 rounded border font-mono text-xs shadow-inner focus-visible:ring-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="btn-mechanical text-secondary-foreground h-10 w-full rounded text-xs font-bold tracking-widest uppercase"
                >
                  <Plus className="h-4 w-4" />
                  {createRoomMutation.isPending ? "CONFIGURING..." : "CREATE ROOM"}
                </Button>
              </form>
            </AnalogCard>

            {/* Rooms List */}
            <AnalogCard className="flex min-h-[350px] flex-1 flex-col p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <PanelTitle label="Telemetry Links" title="Active Rooms" />
                <MonoLabel className="bg-popover border-border rounded border px-2 py-0.5">
                  COUNT: {roomsList.data?.length ?? 0}
                </MonoLabel>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="text-muted-foreground/60 absolute top-2.5 left-3 h-3.5 w-3.5" />
                <Input
                  type="text"
                  placeholder="Filter by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-9 rounded border pl-9 font-mono text-xs shadow-inner focus-visible:ring-1"
                />
              </div>

              {roomsList.isLoading ? (
                <div className="text-muted-foreground flex flex-1 animate-pulse items-center justify-center font-mono text-xs tracking-widest uppercase">
                  FETCHING ROOM TELEMETRY...
                </div>
              ) : !roomsList.data?.length ? (
                <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed p-8 text-center">
                  <FolderOpen className="text-muted-foreground/30 mb-3 h-8 w-8" />
                  <MonoLabel className="mb-1 block">No active channels</MonoLabel>
                  <p className="text-muted-foreground/60 max-w-[240px] font-mono text-[10px] leading-normal">
                    Create your first room above, or join an existing one with an invite link.
                  </p>
                </AnalogInset>
              ) : filteredRooms.length === 0 ? (
                <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed p-8 text-center">
                  <Search className="text-muted-foreground/30 mb-3 h-8 w-8" />
                  <MonoLabel className="mb-1 block">No matches found</MonoLabel>
                  <p className="text-muted-foreground/60 font-mono text-[10px]">
                    No rooms matched &ldquo;{searchQuery}&rdquo;
                  </p>
                </AnalogInset>
              ) : (
                <div className="max-h-[400px] flex-1 space-y-3 overflow-y-auto pr-1 md:max-h-[500px]">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`hover:border-accent/40 cursor-pointer rounded border p-4 transition-[border-color] select-none ${
                        selectedRoomId === room.id
                          ? "border-accent bg-accent/5 shadow-sm"
                          : "border-border bg-card shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="text-foreground text-sm font-bold uppercase">
                            {room.name}
                          </span>
                          {room._shared && (
                            <StatusBadge variant="warn" className="shrink-0 text-[8px]">
                              SHARED
                            </StatusBadge>
                          )}
                        </div>
                        <MonoLabel className="bg-popover border-border text-foreground shrink-0 rounded border px-2 py-0.5">
                          {room.code}
                        </MonoLabel>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <MonoLabel className="text-[9px]">
                          EST: {formatDate(room.createdAt)}
                        </MonoLabel>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(room.code);
                            }}
                            className="btn-mechanical text-secondary-foreground flex items-center gap-1 rounded px-2 py-1 text-[9px] font-bold tracking-wider uppercase transition-transform active:scale-95"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedRoomCode === room.code ? "COPIED" : "LINK"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/rooms/${room.code}/join`);
                            }}
                            className="btn-mechanical text-secondary-foreground flex items-center gap-1 rounded px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-transform active:scale-95"
                          >
                            <Video className="h-3 w-3" />
                            JOIN
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnalogCard>
          </div>

          {/* ── Column 2: Sessions Panel ─────────────────────────────────── */}
          <div className="md:col-span-7">
            {selectedRoomId ? (
              <AnalogCard className="flex min-h-[480px] flex-col p-4 md:p-6">
                <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                  <PanelTitle label="CH 1 : Room History" title={selectedRoom?.name ?? "..."} />
                  <MechButton onClick={() => router.push(`/rooms/${selectedRoom?.code}/settings`)}>
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Room Settings
                  </MechButton>
                </div>

                {recordingSessions.isLoading ? (
                  <div className="text-muted-foreground animate-pulse py-12 text-center font-mono text-xs tracking-widest uppercase">
                    LOADING SESSION LOGS...
                  </div>
                ) : !recordingSessions.data?.length ? (
                  <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed px-6 py-16 text-center">
                    <Film className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                    <MonoLabel className="mb-1 block">No Session Logs Captured</MonoLabel>
                    <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-[10px] leading-normal">
                      Connect to the studio, engage recording, and complete a session to compile
                      tracks here.
                    </p>
                  </AnalogInset>
                ) : (
                  <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                    {/* Latest session quick-access */}
                    <AnalogInset className="relative overflow-hidden p-4">
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <MonoLabel className="text-[9px]">LATEST</MonoLabel>
                        <LedInline color="green" size="sm" />
                      </div>
                      <MonoLabel className="mb-1 block">Quick Access Sheet</MonoLabel>
                      <h3 className="mt-1 flex flex-wrap items-center gap-2 text-base font-bold tracking-tight uppercase">
                        Session {recordingSessions.data[0]?.id.slice(-6).toUpperCase()}
                        <Link
                          href={`/recordings/${recordingSessions.data[0]?.id}`}
                          className="text-accent bg-card border-border inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs underline-offset-2 shadow-sm hover:underline"
                        >
                          Open Details <ExternalLink className="h-3 w-3" />
                        </Link>
                      </h3>
                      <MonoLabel className="mt-2 block">
                        Recorded:{" "}
                        {recordingSessions.data[0]?.startedAt
                          ? formatDateTime(recordingSessions.data[0].startedAt)
                          : ""}{" "}
                        &bull; Tracks: {recordingSessions.data[0]?.tracks.length ?? 0}
                      </MonoLabel>
                    </AnalogInset>

                    {/* All sessions */}
                    <div className="space-y-4">
                      <MonoLabel className="border-border/40 block border-b pb-1">
                        Reel Index Logs
                      </MonoLabel>
                      {recordingSessions.data.map((session) => (
                        <div
                          key={session.id}
                          className="border-border bg-card hover:border-accent/30 rounded border p-4 shadow-sm transition-colors"
                        >
                          <div className="border-border/40 mb-3 flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <MonoLabel className="bg-popover border-border rounded border px-2 py-0.5">
                                REEL: {session.id.slice(-6).toUpperCase()}
                              </MonoLabel>
                              <StatusBadge
                                variant={session.status === "RECORDING" ? "recording" : "default"}
                              >
                                <LedInline
                                  color={session.status === "RECORDING" ? "red" : "red-off"}
                                  size="sm"
                                  pulse={session.status === "RECORDING"}
                                />
                                {session.status}
                              </StatusBadge>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-4 font-mono text-[10px]">
                              <span className="flex items-center gap-1">
                                <Calendar className="text-muted-foreground/60 h-3.5 w-3.5" />
                                {formatDate(session.startedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="text-muted-foreground/60 h-3.5 w-3.5" />
                                {formatTime(session.startedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <MonoLabel>
                              Tracks: {session.tracks?.length ?? 0} |{" "}
                              {session.tracks?.every(
                                (t: { status: string }) => t.status === "COMPLETED",
                              )
                                ? "ALL UPLOADED"
                                : "SYNC PENDING"}
                            </MonoLabel>
                            <Link
                              href={`/recordings/${session.id}`}
                              className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold tracking-wider uppercase transition-transform active:scale-95"
                            >
                              Inspect Tracks <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-border mt-6 flex items-start gap-2.5 border-t pt-4">
                  <LedInline color="green" size="sm" className="mt-0.5 shrink-0" />
                  <MonoLabel className="leading-relaxed">
                    SYSTEM NOTE: Ototabi aggregates raw recordings from browser client databases. If
                    a track shows UPLOADING, visit the{" "}
                    <Link
                      href="/recovery"
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Recovery Console
                    </Link>{" "}
                    to resume uploads.
                  </MonoLabel>
                </div>
              </AnalogCard>
            ) : (
              <div className="min-h-[480px]">
                {recentSessions.isLoading ? (
                  <div className="bg-card border-border flex h-[480px] animate-pulse items-center justify-center rounded-lg border">
                    <div className="flex flex-col items-center gap-3">
                      <div className="border-border border-t-accent h-6 w-6 animate-spin rounded-full border-2" />
                      <span className="text-muted-foreground animate-pulse font-mono text-xs tracking-widest uppercase">
                        Loading Recent Sessions...
                      </span>
                    </div>
                  </div>
                ) : !recentSessions.data?.length ? (
                  <div className="border-border/60 bg-card/30 flex min-h-[480px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
                    <Sliders className="text-muted-foreground/20 h-12 w-12 animate-pulse" />
                    <div>
                      <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                        No Recent Sessions
                      </h3>
                      <p className="text-muted-foreground/60 mt-2 max-w-xs font-mono text-xs leading-relaxed">
                        No recent sessions. Create a room and start recording.
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnalogCard className="flex min-h-[480px] flex-col p-6">
                    <PanelTitle label="Cross-Room Query" title="Recent Sessions" />
                    <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                      {recentSessions.data.map((session) => (
                        <div
                          key={session.id}
                          className="border-border bg-card hover:border-accent/30 rounded border p-4 shadow-sm transition-colors"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MonoLabel className="bg-popover border-border rounded border px-2 py-0.5">
                                {session.id.slice(-6).toUpperCase()}
                              </MonoLabel>
                              <MonoLabel className="text-muted-foreground">
                                {session.room?.name ?? "Unknown"}
                              </MonoLabel>
                            </div>
                            <MonoLabel className="text-muted-foreground text-[10px]">
                              {formatDate(session.startedAt)}
                            </MonoLabel>
                          </div>
                          <div className="flex items-center justify-between">
                            <MonoLabel>
                              Tracks: {session.tracks?.length ?? 0} |{" "}
                              {session.tracks?.every(
                                (t: { status: string }) => t.status === "COMPLETED",
                              )
                                ? "ALL UPLOADED"
                                : "SYNC PENDING"}
                            </MonoLabel>
                            <Link
                              href={`/recordings/${session.id}`}
                              className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold tracking-wider uppercase transition-transform active:scale-95"
                            >
                              View <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnalogCard>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
