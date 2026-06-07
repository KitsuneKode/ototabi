"use client";

import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";
import {
  ArrowLeft,
  Copy,
  Trash2,
  Save,
  AlertTriangle,
  Film,
  ExternalLink,
  Calendar,
  Clock,
  ShieldAlert,
} from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

export default function RoomSettingsPage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const trpc = useTRPC();

  const [roomName, setRoomName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    data: roomInfoData,
    isLoading: roomInfoIsLoading,
    error: _roomInfoError,
    refetch: roomInfoRefetch,
    isFetching: _roomInfoIsFetching,
    isPending: _roomInfoIsPending,
    isSuccess: _roomInfoIsSuccess,
    isError: _roomInfoIsError,
    status: _roomInfoStatus,
  } = useQuery(
    trpc.rooms.getRoom.queryOptions({ code: roomId }, {
      enabled: !!roomId,
      onSuccess: (data: { name: string }) => {
        if (!nameInitialized) {
          setRoomName(data.name);
          setNameInitialized(true);
        }
      },
    } as any),
  );

  const {
    data: authStateData,
    isLoading: authStateIsLoading,
    error: _authStateError,
    refetch: _authStateRefetch,
    isFetching: _authStateIsFetching,
    isPending: _authStateIsPending,
    isSuccess: _authStateIsSuccess,
    isError: _authStateIsError,
    status: _authStateStatus,
  } = useQuery(trpc.auth.getSession.queryOptions());

  const {
    data: sessionsData,
    isLoading: sessionsIsLoading,
    error: _sessionsError,
    refetch: _sessionsRefetch,
    isFetching: _sessionsIsFetching,
    isPending: _sessionsIsPending,
    isSuccess: _sessionsIsSuccess,
    isError: _sessionsIsError,
    status: _sessionsStatus,
  } = useQuery(
    trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: roomInfoData?.id ?? "" },
      { enabled: !!roomInfoData?.id },
    ),
  );

  const updateMutation = useMutation(
    trpc.rooms.updateRoom.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        roomInfoRefetch();
      },
      onError: (err: any) => setSaveError(err.message ?? "Failed to update room"),
    }),
  );

  const deleteMutation = useMutation(
    trpc.rooms.deleteRoom.mutationOptions({
      onSuccess: () => router.push("/dashboard"),
    }),
  );

  // ── Auth Gate ──────────────────────────────────────────────────────────
  if (!authStateIsLoading && !authStateData) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <MechButton
          onClick={() => router.push("/auth/signin")}
          className="w-full max-w-xs justify-center"
        >
          Sign In Required
        </MechButton>
      </div>
    );
  }

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSaveError("");
      if (!roomInfoData?.id) return;
      updateMutation.mutate({ id: roomInfoData.id, name: roomName });
    },
    [roomName, roomInfoData?.id, updateMutation],
  );

  const handleCopyLink = useCallback(() => {
    if (!roomInfoData?.code) return;
    navigator.clipboard.writeText(roomInfoData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomInfoData?.code]);

  const handleDelete = useCallback(() => {
    if (!roomInfoData?.id) return;
    deleteMutation.mutate({ id: roomInfoData.id });
  }, [roomInfoData?.id, deleteMutation]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (roomInfoIsLoading) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Room Config...
          </span>
        </div>
      </div>
    );
  }

  if (!roomInfoData) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-10 w-10" />
          <p className="text-led-on mb-4 text-sm font-bold uppercase">Room Not Found</p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Back to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const data = roomInfoData;
  const confirmMatch = deleteConfirm === data.code;

  return (
    <AppShell maxWidth="max-w-3xl">
      <div className="space-y-8">
        <PageHeader
          label={`${data.name} // ${data.code}`}
          title="Room Settings"
          actions={
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
          }
        />

        {/* ── Room Config ───────────────────────────────────────────────── */}
        <AnalogCard className="space-y-6 p-6">
          <PanelTitle label="Channel Config" title="Room Properties" />

          <form onSubmit={handleSave} className="space-y-4">
            {/* Room name */}
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
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-11 rounded border font-mono text-sm shadow-inner focus-visible:ring-1"
              />
            </div>

            {/* Room code (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                Room Code (Read-Only)
              </Label>
              <AnalogInset className="flex h-11 items-center gap-3 px-3">
                <span className="text-accent font-mono text-sm font-bold tracking-widest">
                  {data.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-mechanical text-secondary-foreground ml-auto flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "COPIED!" : "COPY CODE"}
                </button>
              </AnalogInset>
            </div>

            {saveError && (
              <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded border p-3">
                <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-destructive font-mono text-xs uppercase">{saveError}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="border-led-green/30 bg-led-green/10 flex items-center gap-2 rounded border p-3">
                <LedInline color="green" size="sm" />
                <MonoLabel className="text-led-green">Room name updated successfully.</MonoLabel>
              </div>
            )}

            <MechButton
              type="submit"
              disabled={updateMutation.isPending}
              className="h-11 w-full justify-center text-sm"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "SAVING..." : "SAVE CHANGES"}
            </MechButton>
          </form>
        </AnalogCard>

        {/* ── Members ────────────────────────────────────────────────────── */}
        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Crew Roster" title="Room Members" className="mb-4" />
          <MembersPanel roomId={data.id} />
        </AnalogCard>

        <StudioAccessPanel
          roomId={data.id}
          isLocked={"isLocked" in data ? Boolean((data as { isLocked?: boolean }).isLocked) : false}
        />

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Secure Access" title="Invite Links" className="mb-4" />
          <InvitesPanel roomId={data.id} roomCode={data.code} />
        </AnalogCard>

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <PanelTitle label="Reel Index" title="Recent Sessions" className="mb-4" />

          {sessionsIsLoading ? (
            <div className="text-muted-foreground animate-pulse py-8 text-center font-mono text-xs tracking-widest uppercase">
              Loading session logs...
            </div>
          ) : !sessionsData?.length ? (
            <AnalogInset className="flex flex-col items-center justify-center border-dashed py-12 text-center">
              <Film className="text-muted-foreground/30 mb-3 h-8 w-8" />
              <MonoLabel>No sessions recorded yet</MonoLabel>
            </AnalogInset>
          ) : (
            <div className="space-y-3">
              {sessionsData.slice(0, 5).map((session) => (
                <AnalogInset
                  key={session.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={session.status === "RECORDING" ? "recording" : "default"}>
                      <LedInline
                        color={session.status === "RECORDING" ? "red" : "red-off"}
                        size="sm"
                        pulse={session.status === "RECORDING"}
                      />
                      {session.status}
                    </StatusBadge>
                    <div>
                      <MonoLabel className="text-foreground text-[9px] font-bold">
                        {session.id.slice(-8).toUpperCase()}
                      </MonoLabel>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Calendar className="text-muted-foreground/60 h-3 w-3" />
                        <MonoLabel className="text-[9px]">
                          {formatDate(session.startedAt)}
                        </MonoLabel>
                        <Clock className="text-muted-foreground/60 h-3 w-3" />
                        <MonoLabel className="text-[9px]">
                          {formatTime(session.startedAt)}
                        </MonoLabel>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/recordings/${session.id}`}
                    className="btn-mechanical text-secondary-foreground inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                  >
                    View Tracks <ExternalLink className="h-3 w-3" />
                  </Link>
                </AnalogInset>
              ))}
            </div>
          )}
        </AnalogCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <AnalogCard className="border-led-on/20 p-6">
          <PanelTitle label="⚠ Danger Zone" title="Delete Room" className="mb-2" />
          <p className="text-muted-foreground mb-5 font-mono text-xs leading-relaxed">
            Permanently deletes this room and all associated session metadata. Uploaded recordings
            in storage are not removed. This action cannot be undone.
          </p>
          <MechButton
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="h-11 w-full justify-center text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete Room
          </MechButton>
        </AnalogCard>

        {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
        {showDeleteModal && (
          <div
            className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            tabIndex={-1}
          >
            <AnalogCard className="animate-in fade-in zoom-in-95 w-full max-w-md space-y-6 p-8 duration-200">
              <div role="document">
                <div className="flex items-start gap-4">
                  <div className="bg-led-on/10 border-led-on/30 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                    <Trash2 className="text-led-on h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight uppercase">Confirm Deletion</h3>
                    <p className="text-muted-foreground mt-1 font-mono text-xs leading-relaxed">
                      Type the room code <span className="text-accent font-bold">{data.code}</span>{" "}
                      to confirm permanent deletion.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                    Confirm Room Code
                  </Label>
                  <Input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={data.code}
                    className="border-border bg-popover text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-led-on/40 h-11 rounded border font-mono text-sm tracking-widest shadow-inner focus-visible:ring-1"
                  />
                </div>

                <div className="flex gap-3">
                  <MechButton
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirm("");
                    }}
                    className="flex-1 justify-center"
                  >
                    Cancel
                  </MechButton>
                  <MechButton
                    variant="danger"
                    onClick={handleDelete}
                    disabled={!confirmMatch || deleteMutation.isPending}
                    className="flex-1 justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteMutation.isPending ? "DELETING..." : "DELETE"}
                  </MechButton>
                </div>
              </div>
            </AnalogCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StudioAccessPanel({ roomId, isLocked }: { roomId: string; isLocked: boolean }) {
  const trpc = useTRPC();
  const [locked, setLocked] = useState(isLocked);

  const {
    data: pendingData,
    isLoading: pendingIsLoading,
    error: _pendingError,
    refetch: pendingRefetch,
    isFetching: _pendingIsFetching,
    isPending: _pendingIsPending,
    isSuccess: _pendingIsSuccess,
    isError: _pendingIsError,
    status: _pendingStatus,
  } = useQuery(
    trpc.rooms.listJoinRequests.queryOptions(
      { roomId, status: "pending" },
      { enabled: !!roomId, refetchInterval: 5000 },
    ),
  );

  const lockMutation = useMutation(trpc.rooms.lockRoom.mutationOptions());
  const unlockMutation = useMutation(trpc.rooms.unlockRoom.mutationOptions());
  const admitMutation = useMutation(
    trpc.rooms.admitJoinRequest.mutationOptions({
      onSuccess: () => pendingRefetch(),
    }),
  );
  const denyMutation = useMutation(
    trpc.rooms.denyJoinRequest.mutationOptions({
      onSuccess: () => pendingRefetch(),
    }),
  );

  const toggleLock = useCallback(() => {
    if (locked) {
      unlockMutation.mutate({ roomId }, { onSuccess: () => setLocked(false) });
    } else {
      lockMutation.mutate({ roomId }, { onSuccess: () => setLocked(true) });
    }
  }, [locked, lockMutation, unlockMutation, roomId]);

  return (
    <AnalogCard className="space-y-4 p-6">
      <PanelTitle label="Studio Gate" title="Lock & Admit" className="mb-4" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground font-mono text-xs leading-relaxed">
          When locked, guests with an invite must be admitted before they can join or receive a
          LiveKit token.
        </p>
        <MechButton
          onClick={toggleLock}
          disabled={lockMutation.isPending || unlockMutation.isPending}
          className="h-10 shrink-0 justify-center px-4 text-xs"
        >
          <ShieldAlert className="h-4 w-4" />
          {locked ? "UNLOCK ROOM" : "LOCK ROOM"}
        </MechButton>
      </div>

      {locked && (
        <div className="space-y-2">
          <MonoLabel className="text-[9px]">Pending join requests</MonoLabel>
          {pendingIsLoading ? (
            <MonoLabel className="text-muted-foreground animate-pulse text-[9px]">
              Loading...
            </MonoLabel>
          ) : !pendingData?.length ? (
            <AnalogInset className="border-dashed py-6 text-center">
              <MonoLabel className="text-muted-foreground">No guests waiting</MonoLabel>
            </AnalogInset>
          ) : (
            <div className="space-y-2">
              {pendingData.map((req) => (
                <AnalogInset
                  key={req.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <MonoLabel className="text-foreground text-[10px] font-bold">
                    {req.user.name}
                  </MonoLabel>
                  <div className="flex gap-2">
                    <MechButton
                      className="h-8 px-3 text-[10px]"
                      onClick={() => admitMutation.mutate({ roomId, targetUserId: req.userId })}
                      disabled={admitMutation.isPending}
                    >
                      Admit
                    </MechButton>
                    <MechButton
                      variant="danger"
                      className="h-8 px-3 text-[10px]"
                      onClick={() => denyMutation.mutate({ roomId, targetUserId: req.userId })}
                      disabled={denyMutation.isPending}
                    >
                      Deny
                    </MechButton>
                  </div>
                </AnalogInset>
              ))}
            </div>
          )}
        </div>
      )}
    </AnalogCard>
  );
}

function MembersPanel({ roomId }: { roomId: string }) {
  const trpc = useTRPC();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const {
    data: membersData,
    isLoading: _membersIsLoading,
    error: _membersError,
    refetch: membersRefetch,
    isFetching: _membersIsFetching,
    isPending: _membersIsPending,
    isSuccess: _membersIsSuccess,
    isError: _membersIsError,
    status: _membersStatus,
  } = useQuery(trpc.rooms.getRoomMembers.queryOptions({ roomId }, { enabled: !!roomId }));

  const inviteMutation = useMutation(
    trpc.rooms.inviteMember.mutationOptions({
      onSuccess: () => {
        setInviteEmail("");
        setInviteError("");
        membersRefetch();
      },
      onError: (err) => setInviteError(err.message),
    }),
  );

  const removeMutation = useMutation(
    trpc.rooms.removeMember.mutationOptions({
      onSuccess: () => membersRefetch(),
    }),
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inviteEmail.trim()) inviteMutation.mutate({ roomId, email: inviteEmail.trim() });
        }}
        className="flex gap-2"
      >
        <Input
          type="email"
          placeholder="Invite by email..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="border-border bg-popover text-foreground h-10 flex-1 rounded border font-mono text-xs shadow-inner"
        />
        <MechButton type="submit" disabled={inviteMutation.isPending} className="h-10 shrink-0">
          {inviteMutation.isPending ? "..." : "Invite"}
        </MechButton>
      </form>
      {inviteError && <MonoLabel className="text-led-on">{inviteError}</MonoLabel>}

      {membersData?.length ? (
        <div className="space-y-1.5">
          {membersData.map((m) => (
            <div
              key={m.id}
              className="border-border bg-popover flex items-center justify-between rounded border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{m.user.name}</span>
                <MonoLabel className="text-[9px]">{m.role.toUpperCase()}</MonoLabel>
              </div>
              {m.role !== "host" && (
                <MechButton
                  onClick={() => removeMutation.mutate({ roomId, targetUserId: m.userId })}
                  className="h-7 px-2 text-[9px]"
                >
                  Remove
                </MechButton>
              )}
            </div>
          ))}
        </div>
      ) : (
        <MonoLabel className="text-muted-foreground/60">
          No members yet. Invite collaborators above.
        </MonoLabel>
      )}
    </div>
  );
}

function InvitesPanel({ roomId, roomCode }: { roomId: string; roomCode: string }) {
  const trpc = useTRPC();
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const {
    data: invitesData,
    isLoading: _invitesIsLoading,
    error: _invitesError,
    refetch: invitesRefetch,
    isFetching: _invitesIsFetching,
    isPending: _invitesIsPending,
    isSuccess: _invitesIsSuccess,
    isError: _invitesIsError,
    status: _invitesStatus,
  } = useQuery(trpc.rooms.listInvites.queryOptions({ roomId }, { enabled: !!roomId }));

  const createInvite = useMutation(
    trpc.rooms.createInvite.mutationOptions({
      onSuccess: (invite) => {
        const link = `${window.location.origin}/rooms/${roomCode}/join?invite=${invite.token}`;
        setInviteLink(link);
        setInviteError("");
        invitesRefetch();
      },
      onError: (err) => setInviteError(err.message),
    }),
  );

  const revokeInvite = useMutation(
    trpc.rooms.revokeInvite.mutationOptions({
      onSuccess: () => invitesRefetch(),
    }),
  );

  const createDefaultInvite = () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    createInvite.mutate({ roomId, role: "participant", maxUses: 1, expiresAt });
  };

  const copyInviteLink = (inviteId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <MonoLabel className="mb-1 block">Guest access is token-gated</MonoLabel>
          <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
            Create a single-use participant invite. The raw token is shown once and stored only as a
            hash on the server.
          </p>
        </div>
        <MechButton
          type="button"
          onClick={createDefaultInvite}
          disabled={createInvite.isPending}
          className="h-10 shrink-0"
        >
          {createInvite.isPending ? "CREATING..." : "Create Secure Link"}
        </MechButton>
      </div>

      {inviteLink && (
        <AnalogInset className="space-y-2 p-3">
          <MonoLabel className="text-accent block">New invite link</MonoLabel>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="border-border bg-popover text-foreground h-10 flex-1 rounded border font-mono text-[10px] shadow-inner"
            />
            <MechButton type="button" onClick={() => copyInviteLink("new", inviteLink)}>
              <Copy className="h-3 w-3" />
              {copiedInviteId === "new" ? "Copied" : "Copy"}
            </MechButton>
          </div>
        </AnalogInset>
      )}

      {inviteError && <MonoLabel className="text-led-on">{inviteError}</MonoLabel>}

      {invitesData?.length ? (
        <div className="space-y-1.5">
          {invitesData.map((invite) => {
            const revoked = !!invite.revokedAt;
            const expired = !!invite.expiresAt && invite.expiresAt <= new Date();
            return (
              <div
                key={invite.id}
                className="border-border bg-popover flex flex-col gap-3 rounded border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <MonoLabel className="text-[9px]">
                    ROLE: {invite.role.toUpperCase()} {"//"} USES: {invite.usedCount}/
                    {invite.maxUses ?? "∞"}
                  </MonoLabel>
                  <MonoLabel className="mt-1 block text-[9px]">
                    {revoked
                      ? "REVOKED"
                      : expired
                        ? "EXPIRED"
                        : invite.expiresAt
                          ? `EXPIRES: ${formatDateTime(invite.expiresAt)}`
                          : "NO EXPIRY"}
                  </MonoLabel>
                </div>
                {!revoked && (
                  <MechButton
                    type="button"
                    onClick={() => revokeInvite.mutate({ roomId, inviteId: invite.id })}
                    className="h-7 px-2 text-[9px]"
                  >
                    Revoke
                  </MechButton>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <MonoLabel className="text-muted-foreground/60">
          No secure invite links yet. Create one before sharing with guests.
        </MonoLabel>
      )}
    </div>
  );
}
