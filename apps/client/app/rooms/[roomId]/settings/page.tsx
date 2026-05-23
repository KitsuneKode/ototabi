"use client";

import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { formatDate, formatTime } from "@/lib/date-utils";
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

  const roomInfo = useQuery(
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

  const authState = useQuery(trpc.auth.getSession.queryOptions());

  // ── Auth Gate ──────────────────────────────────────────────────────────
  if (!authState.isLoading && !authState.data) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <MechButton
          onClick={() => router.push("/auth/signin")}
          className="w-full max-w-xs justify-center"
        >
          Sign In Required
        </MechButton>
      </div>
    );
  }

  const sessions = useQuery(
    trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: roomInfo.data?.id ?? "" },
      { enabled: !!roomInfo.data?.id },
    ),
  );

  const updateMutation = useMutation(
    trpc.rooms.updateRoom.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        roomInfo.refetch();
      },
      onError: (err: any) => setSaveError(err.message ?? "Failed to update room"),
    }),
  );

  const deleteMutation = useMutation(
    trpc.rooms.deleteRoom.mutationOptions({
      onSuccess: () => router.push("/dashboard"),
    }),
  );

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSaveError("");
      if (!roomInfo.data?.id) return;
      updateMutation.mutate({ id: roomInfo.data.id, name: roomName });
    },
    [roomName, roomInfo.data?.id, updateMutation],
  );

  const handleCopyLink = useCallback(() => {
    if (!roomInfo.data?.code) return;
    navigator.clipboard.writeText(`${window.location.origin}/rooms/${roomInfo.data.code}/join`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomInfo.data?.code]);

  const handleDelete = useCallback(() => {
    if (!roomInfo.data?.id) return;
    deleteMutation.mutate({ id: roomInfo.data.id });
  }, [roomInfo.data?.id, deleteMutation]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (roomInfo.isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Room Config...
          </span>
        </div>
      </div>
    );
  }

  if (!roomInfo.data) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
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

  const data = roomInfo.data;
  const confirmMatch = deleteConfirm === data.code;

  return (
    <div className="bg-background text-foreground relative min-h-screen p-4 font-sans md:p-8">
      <NoiseBackground />

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="border-border flex items-end justify-between border-b-2 pb-4">
          <div className="flex items-end gap-4">
            <MechButton
              onClick={() => router.push("/dashboard")}
              aria-label="Back to Dashboard"
              className="h-9 px-2.5 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl leading-none font-bold tracking-tight uppercase">
                Room Settings
              </h1>
              <MonoLabel className="mt-1.5 block">
                {data.name} // {data.code}
              </MonoLabel>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Led color="green" size="md" pulse label="LIVE" />
          </div>
        </header>

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
                  {copied ? "COPIED!" : "COPY LINK"}
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

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <PanelTitle label="Reel Index" title="Recent Sessions" className="mb-4" />

          {sessions.isLoading ? (
            <div className="text-muted-foreground animate-pulse py-8 text-center font-mono text-xs tracking-widest uppercase">
              Loading session logs...
            </div>
          ) : !sessions.data?.length ? (
            <AnalogInset className="flex flex-col items-center justify-center border-dashed py-12 text-center">
              <Film className="text-muted-foreground/30 mb-3 h-8 w-8" />
              <MonoLabel>No sessions recorded yet</MonoLabel>
            </AnalogInset>
          ) : (
            <div className="space-y-3">
              {sessions.data.slice(0, 5).map((session) => (
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
      </div>

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
                    Type the room code <span className="text-accent font-bold">{data.code}</span> to
                    confirm permanent deletion.
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
  );
}
