'use client'

import { useState, useCallback } from 'react'
import { useTRPC } from '@/trpc/client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Input } from '@ototabi/ui/components/input'
import { Label } from '@ototabi/ui/components/label'
import { AnalogCard, AnalogInset } from '@/components/ui/analog-card'
import { Led, LedInline } from '@/components/ui/led'
import {
  MonoLabel,
  PanelTitle,
  StatusBadge,
  NoiseBackground,
  MechButton,
} from '@/components/ui/retro-primitives'
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
} from 'lucide-react'

export default function RoomSettingsPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  const trpc = useTRPC()

  const [roomName, setRoomName] = useState('')
  const [nameInitialized, setNameInitialized] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const roomInfo = useQuery(
    trpc.rooms.getRoom.queryOptions(
      { code: roomId },
      {
        enabled: !!roomId,
        onSuccess: (data: { name: string }) => {
          if (!nameInitialized) {
            setRoomName(data.name)
            setNameInitialized(true)
          }
        },
      } as any,
    ),
  )

  const sessions = useQuery(
    trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: roomInfo.data?.id ?? '' },
      { enabled: !!roomInfo.data?.id },
    ),
  )

  const updateMutation = useMutation(
    trpc.rooms.updateRoom.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2500)
        roomInfo.refetch()
      },
      onError: (err: any) => setSaveError(err.message ?? 'Failed to update room'),
    }),
  )

  const deleteMutation = useMutation(
    trpc.rooms.deleteRoom.mutationOptions({
      onSuccess: () => router.push('/dashboard'),
    }),
  )

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSaveError('')
      if (!roomInfo.data?.id) return
      updateMutation.mutate({ id: roomInfo.data.id, name: roomName })
    },
    [roomName, roomInfo.data?.id, updateMutation],
  )

  const handleCopyLink = useCallback(() => {
    if (!roomInfo.data?.code) return
    navigator.clipboard.writeText(`${window.location.origin}/rooms/${roomInfo.data.code}/join`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomInfo.data?.code])

  const handleDelete = useCallback(() => {
    if (!roomInfo.data?.id) return
    deleteMutation.mutate({ id: roomInfo.data.id })
  }, [roomInfo.data?.id, deleteMutation])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (roomInfo.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Loading Room Config...
          </span>
        </div>
      </div>
    )
  }

  if (!roomInfo.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-sm w-full">
          <AlertTriangle className="mx-auto h-10 w-10 text-led-on mb-4" />
          <p className="font-bold uppercase text-led-on text-sm mb-4">Room Not Found</p>
          <MechButton onClick={() => router.push('/dashboard')} className="w-full justify-center">
            Back to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  const data = roomInfo.data
  const confirmMatch = deleteConfirm === data.code

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 relative">
      <NoiseBackground />

      <div className="max-w-3xl w-full mx-auto relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-end justify-between border-b-2 border-border pb-4">
          <div className="flex items-end gap-4">
            <MechButton onClick={() => router.push('/dashboard')} className="px-2.5 py-2 h-9">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl font-bold leading-none tracking-tight uppercase">
                Room Settings
              </h1>
              <MonoLabel className="block mt-1.5">
                {data.name} // {data.code}
              </MonoLabel>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Led color="green" size="md" pulse label="LIVE" />
          </div>
        </header>

        {/* ── Room Config ───────────────────────────────────────────────── */}
        <AnalogCard className="p-6 space-y-6">
          <PanelTitle label="Channel Config" title="Room Properties" />

          <form onSubmit={handleSave} className="space-y-4">
            {/* Room name */}
            <div className="space-y-1.5">
              <Label htmlFor="room-name" className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Room Name
              </Label>
              <Input
                id="room-name"
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="h-11 border border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-accent/60 rounded font-mono text-sm shadow-inner"
              />
            </div>

            {/* Room code (read-only) */}
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Room Code (Read-Only)
              </Label>
              <AnalogInset className="h-11 flex items-center px-3 gap-3">
                <span className="font-mono text-sm font-bold text-accent tracking-widest">{data.code}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ml-auto flex items-center gap-1.5 btn-mechanical px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-secondary-foreground"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'COPIED!' : 'COPY LINK'}
                </button>
              </AnalogInset>
            </div>

            {saveError && (
              <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 rounded">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-destructive uppercase">{saveError}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 border border-led-green/30 bg-led-green/10 p-3 rounded">
                <LedInline color="green" size="sm" />
                <MonoLabel className="text-led-green">Room name updated successfully.</MonoLabel>
              </div>
            )}

            <MechButton
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full justify-center h-11 text-sm"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </MechButton>
          </form>
        </AnalogCard>

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <PanelTitle label="Reel Index" title="Recent Sessions" className="mb-4" />

          {sessions.isLoading ? (
            <div className="py-8 text-center font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-widest">
              Loading session logs...
            </div>
          ) : !sessions.data?.length ? (
            <AnalogInset className="py-12 flex flex-col items-center justify-center text-center border-dashed">
              <Film className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <MonoLabel>No sessions recorded yet</MonoLabel>
            </AnalogInset>
          ) : (
            <div className="space-y-3">
              {sessions.data.slice(0, 5).map((session) => (
                <AnalogInset key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={session.status === 'RECORDING' ? 'recording' : 'default'}>
                      <LedInline color={session.status === 'RECORDING' ? 'red' : 'red-off'} size="sm" pulse={session.status === 'RECORDING'} />
                      {session.status}
                    </StatusBadge>
                    <div>
                      <MonoLabel className="text-[9px] text-foreground font-bold">
                        {session.id.slice(-8).toUpperCase()}
                      </MonoLabel>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
                        <MonoLabel className="text-[9px]">{new Date(session.startedAt).toLocaleDateString()}</MonoLabel>
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <MonoLabel className="text-[9px]">{new Date(session.startedAt).toLocaleTimeString()}</MonoLabel>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/recordings/${session.id}`}
                    className="inline-flex items-center gap-1.5 btn-mechanical px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded text-secondary-foreground shrink-0"
                  >
                    View Tracks <ExternalLink className="h-3 w-3" />
                  </Link>
                </AnalogInset>
              ))}
            </div>
          )}
        </AnalogCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <AnalogCard className="p-6 border-led-on/20">
          <PanelTitle label="⚠ Danger Zone" title="Delete Room" className="mb-2" />
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">
            Permanently deletes this room and all associated session metadata. Uploaded recordings in storage are not removed. This action cannot be undone.
          </p>
          <MechButton
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full justify-center h-11 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete Room
          </MechButton>
        </AnalogCard>

      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <AnalogCard className="p-8 max-w-md w-full space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-led-on/10 border border-led-on/30 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5 text-led-on" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Confirm Deletion</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
                  Type the room code <span className="text-accent font-bold">{data.code}</span> to confirm permanent deletion.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Confirm Room Code
              </Label>
              <Input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={data.code}
                className="h-11 border border-border bg-popover text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-led-on/40 rounded font-mono text-sm shadow-inner tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <MechButton
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
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
                {deleteMutation.isPending ? 'DELETING...' : 'DELETE'}
              </MechButton>
            </div>
          </AnalogCard>
        </div>
      )}
    </div>
  )
}
