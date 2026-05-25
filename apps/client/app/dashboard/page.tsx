"use client";

import { Button } from "@ototabi/ui/components/button";
import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useMemo } from "react";

import { DashboardRoomList, type DashboardRoom } from "@/components/dashboard/dashboard-room-list";
import { DashboardSessionsPanel } from "@/components/dashboard/dashboard-sessions-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton } from "@/components/ui/retro-primitives";
import { useAuthGate } from "@/lib/hooks/use-session";
import { Lock, Plus } from "@/lib/icons";
import { isTrpcUnauthorized } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { authState, isBooting, showGate, sessionReady } = useAuthGate();
  const sessionSettled = authState.isFetched && !authState.isFetching;
  const canLoadDashboardData = sessionReady && sessionSettled;

  const summary = useQuery({
    ...trpc.dashboard.getSummary.queryOptions(),
    enabled: canLoadDashboardData,
    retry: (failureCount, error) =>
      isTrpcUnauthorized(error) ? failureCount < 2 : failureCount < 1,
  });

  const createRoomMutation = useMutation(
    trpc.rooms.createRoom.mutationOptions({
      onSuccess: (room) => {
        setNewRoomName("");
        summary.refetch();
        if (room.lobbyInviteToken) {
          const inviteLink = `${window.location.origin}/rooms/${room.code}/join?invite=${room.lobbyInviteToken}`;
          void navigator.clipboard.writeText(inviteLink);
          setCopiedRoomCode(room.code);
          setTimeout(() => setCopiedRoomCode(null), 3000);
        }
      },
    }),
  );

  const createInviteMutation = useMutation(trpc.rooms.createInvite.mutationOptions());

  const recentSessions = summary.data?.recentSessions ?? [];

  const allRooms = useMemo(() => {
    const owned = summary.data?.ownedRooms ?? [];
    const shared = summary.data?.sharedRooms ?? [];
    return [
      ...owned.map((r) => ({ ...r, isShared: false as const })),
      ...shared.map((r) => ({ ...r, isShared: true as const })),
    ];
  }, [summary.data?.ownedRooms, summary.data?.sharedRooms]);

  const ownedRooms = summary.data?.ownedRooms ?? [];
  const sharedRooms = summary.data?.sharedRooms ?? [];

  useEffect(() => {
    if (selectedRoomId || allRooms.length === 0) return;
    if (allRooms.length === 1) {
      setSelectedRoomId(allRooms[0]!.id);
      return;
    }
    const sorted = [...allRooms].toSorted((a, b) => {
      const aTime = a.updatedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.updatedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
    setSelectedRoomId(sorted[0]!.id);
  }, [allRooms, selectedRoomId]);

  const recordingSessions = useQuery({
    ...trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: selectedRoomId || "" },
      { enabled: !!selectedRoomId },
    ),
  });

  const selectedRoom = allRooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleCreateRoom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRoomName.trim()) return;
      createRoomMutation.mutate({ name: newRoomName.trim() });
    },
    [newRoomName, createRoomMutation],
  );

  const handleCopyInvite = useCallback(
    async (room: DashboardRoom) => {
      try {
        const invite = await createInviteMutation.mutateAsync({
          roomId: room.id,
          role: "participant",
        });
        const link = `${window.location.origin}/rooms/${room.code}/join?invite=${invite.token}`;
        await navigator.clipboard.writeText(link);
        setCopiedRoomCode(room.code);
        setTimeout(() => setCopiedRoomCode(null), 2000);
      } catch {
        const fallback = `${window.location.origin}/rooms/${room.code}/join`;
        await navigator.clipboard.writeText(fallback);
        setCopiedRoomCode(room.code);
        setTimeout(() => setCopiedRoomCode(null), 2000);
      }
    },
    [createInviteMutation],
  );

  const handleOpenStudio = useCallback(
    (room: DashboardRoom) => {
      router.push(`/chat/${room.code}`);
    },
    [router],
  );

  if (isBooting) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col space-y-8">
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
            <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
              Initializing Dashboard Console...
            </span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (showGate) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
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
          <MechButton onClick={() => router.push("/auth/signin")} className="w-full">
            Sign In
          </MechButton>
          <p className="text-muted-foreground mt-4 font-mono text-[10px] leading-relaxed">
            New here?{" "}
            <Link href="/auth/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </AnalogCard>
      </div>
    );
  }

  const dataError = summary.error;
  const suppressDataError =
    dataError &&
    isTrpcUnauthorized(dataError) &&
    (isBooting || authState.isFetching || !canLoadDashboardData);
  const dataErrorMessage =
    dataError && "message" in dataError && typeof dataError.message === "string"
      ? dataError.message
      : "Failed to load dashboard data";

  return (
    <AppShell>
      <div className="flex flex-1 flex-col space-y-8">
        <PageHeader
          label="Host Room Controller"
          title="Dashboard"
          description="Create studios, review sessions, and recover local uploads."
        />

        {dataError && !suppressDataError ? (
          <AnalogCard className="border-destructive/40 bg-destructive/10 p-4">
            <p className="text-destructive text-sm font-bold tracking-wider uppercase">
              Dashboard sync failed
            </p>
            <p className="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
              {dataErrorMessage}. If you recently pulled main, run{" "}
              <code className="text-foreground">bun run db:migrate</code> from the repo root.
            </p>
          </AnalogCard>
        ) : null}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="flex flex-col gap-6 md:col-span-5">
            <AnalogCard className="p-4 md:p-6">
              <h2 className="mb-4 text-xl font-bold tracking-tight uppercase">Initialize Room</h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    type="text"
                    required
                    placeholder="e.g., Podcast Episode 01"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={createRoomMutation.isPending}>
                  <Plus className="h-4 w-4" />
                  {createRoomMutation.isPending ? "CONFIGURING..." : "CREATE ROOM"}
                </Button>
              </form>
            </AnalogCard>

            <DashboardRoomList
              ownedRooms={ownedRooms}
              sharedRooms={sharedRooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCopyInvite={handleCopyInvite}
              onOpenStudio={handleOpenStudio}
              isLoading={summary.isLoading}
              copiedRoomCode={copiedRoomCode}
            />
          </div>

          <div className="md:col-span-7">
            <DashboardSessionsPanel
              selectedRoom={selectedRoom}
              roomSessions={recordingSessions.data ?? []}
              recentSessions={recentSessions}
              isLoadingRoomSessions={recordingSessions.isLoading}
              isLoadingRecent={summary.isLoading}
              onOpenSettings={() => {
                if (selectedRoom) router.push(`/rooms/${selectedRoom.code}/settings`);
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
