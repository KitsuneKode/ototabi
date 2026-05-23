'use client'

import { useState, useCallback } from 'react'
import { useTRPC } from '@/trpc/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@ototabi/auth/client'
import { Input } from '@ototabi/ui/components/input'
import { Label } from '@ototabi/ui/components/label'
import { Button } from '@ototabi/ui/components/button'
import { useQuery, useMutation } from '@tanstack/react-query'
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
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const trpc = useTRPC()

  const [newRoomName, setNewRoomName] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const authState = useQuery(trpc.auth.getSession.queryOptions())
  const roomsList = useQuery(trpc.rooms.listRooms.queryOptions())

  const createRoomMutation = useMutation(
    trpc.rooms.createRoom.mutationOptions({
      onSuccess: () => {
        setNewRoomName('')
        roomsList.refetch()
      },
    }),
  )

  const recordingSessions = useQuery(
    trpc.rooms.getRecordingSessions.queryOptions(
      { roomId: selectedRoomId || '' },
      { enabled: !!selectedRoomId },
    ),
  )

  const handleCreateRoom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newRoomName.trim()) return
      createRoomMutation.mutate({ name: newRoomName.trim() })
    },
    [newRoomName, createRoomMutation],
  )

  const handleCopyLink = useCallback((code: string) => {
    const link = `${window.location.origin}/rooms/${code}/join`
    navigator.clipboard.writeText(link)
    setCopiedRoomCode(code)
    setTimeout(() => setCopiedRoomCode(null), 2000)
  }, [])

  const handleSignOut = useCallback(async () => {
    await authClient.signOut()
    router.push('/')
  }, [router])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Initializing Dashboard Console...
          </span>
        </div>
      </div>
    )
  }

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!authState.data?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-led-on/10 border border-led-on/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-led-on" />
          </div>
          <p className="mb-2 font-bold uppercase tracking-wider text-led-on text-sm font-sans">
            System Access Gated
          </p>
          <p className="mb-6 font-mono text-xs text-muted-foreground leading-normal">
            Authenticate to establish console link.
          </p>
          <MechButton onClick={() => router.push('/')} className="w-full">
            Authenticate
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  const selectedRoom = roomsList.data?.find((r) => r.id === selectedRoomId)
  const filteredRooms =
    roomsList.data?.filter(
      (room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.code.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? []

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 flex flex-col relative overflow-x-hidden">
      <NoiseBackground />

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-border pb-4 gap-4">
          <div>
            <h1 className="text-4xl font-bold leading-none tracking-tight uppercase">Dashboard</h1>
            <MonoLabel className="block mt-1.5">Model 16-A // Host Room Controller Board</MonoLabel>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* User tag */}
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded shadow-sm">
              <Led color="amber" size="sm" pulse />
              <MonoLabel>
                <span className="text-muted-foreground mr-1">OP:</span>
                <span className="text-foreground font-bold">{authState.data.user.name}</span>
              </MonoLabel>
            </div>

            <MechButton onClick={() => router.push('/settings')}>
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
          <div className="md:col-span-5 flex flex-col gap-6">

            {/* Create Room */}
            <AnalogCard className="p-6">
              <MonoLabel className="block mb-1">Sequence Config</MonoLabel>
              <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Initialize Room</h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="room-name"
                    className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest"
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
                    className="h-10 border border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-accent/60 rounded font-mono text-xs shadow-inner"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="btn-mechanical w-full h-10 rounded text-xs font-bold uppercase tracking-widest text-secondary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  {createRoomMutation.isPending ? 'CONFIGURING...' : 'CREATE ROOM'}
                </Button>
              </form>
            </AnalogCard>

            {/* Rooms List */}
            <AnalogCard className="p-6 flex-1 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <PanelTitle label="Telemetry Links" title="Active Rooms" />
                <MonoLabel className="bg-popover border border-border px-2 py-0.5 rounded">
                  COUNT: {roomsList.data?.length ?? 0}
                </MonoLabel>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder="Filter by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 border border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-accent/60 rounded font-mono text-xs shadow-inner"
                />
              </div>

              {roomsList.isLoading ? (
                <div className="flex-1 flex items-center justify-center font-mono text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
                  FETCHING ROOM TELEMETRY...
                </div>
              ) : !roomsList.data?.length ? (
                <AnalogInset className="flex-1 flex flex-col items-center justify-center p-8 text-center border-dashed">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <MonoLabel className="block mb-1">No active channels</MonoLabel>
                  <p className="font-mono text-[10px] text-muted-foreground/60 leading-normal max-w-[200px]">
                    Create a recording room above to configure a telemetry channel.
                  </p>
                </AnalogInset>
              ) : filteredRooms.length === 0 ? (
                <AnalogInset className="flex-1 flex flex-col items-center justify-center p-8 text-center border-dashed">
                  <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <MonoLabel className="block mb-1">No matches found</MonoLabel>
                  <p className="font-mono text-[10px] text-muted-foreground/60">
                    No rooms matched &ldquo;{searchQuery}&rdquo;
                  </p>
                </AnalogInset>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 flex-1">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`cursor-pointer border p-4 rounded transition-[border-color] hover:border-accent/40 select-none ${
                        selectedRoomId === room.id
                          ? 'border-accent bg-accent/5 shadow-sm'
                          : 'border-border bg-card shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground truncate pr-2 uppercase">
                          {room.name}
                        </span>
                        <MonoLabel className="bg-popover border border-border px-2 py-0.5 rounded shrink-0 text-foreground">
                          {room.code}
                        </MonoLabel>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <MonoLabel className="text-[9px]">
                          EST: {new Date(room.createdAt).toLocaleDateString()}
                        </MonoLabel>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(room.code) }}
                            className="flex items-center gap-1 btn-mechanical px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded text-secondary-foreground active:scale-95 transition-transform"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedRoomCode === room.code ? 'COPIED' : 'LINK'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/rooms/${room.code}/join`) }}
                            className="flex items-center gap-1 btn-mechanical px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded text-secondary-foreground active:scale-95 transition-transform"
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
              <AnalogCard className="p-6 min-h-[480px] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                  <PanelTitle label="CH 1 : Room History" title={selectedRoom?.name ?? '...'} />
                  <MechButton onClick={() => router.push(`/rooms/${selectedRoom?.code}/settings`)}>
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Room Settings
                  </MechButton>
                </div>

                {recordingSessions.isLoading ? (
                  <div className="py-12 text-center font-mono text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
                    LOADING SESSION LOGS...
                  </div>
                ) : !recordingSessions.data?.length ? (
                  <AnalogInset className="flex-1 py-16 px-6 text-center border-dashed flex flex-col items-center justify-center">
                    <Film className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <MonoLabel className="block mb-1">No Session Logs Captured</MonoLabel>
                    <p className="font-mono text-[10px] text-muted-foreground/60 leading-normal max-w-sm mx-auto">
                      Connect to the studio, engage recording, and complete a session to compile tracks here.
                    </p>
                  </AnalogInset>
                ) : (
                  <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                    {/* Latest session quick-access */}
                    <AnalogInset className="p-4 relative overflow-hidden">
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <MonoLabel className="text-[9px]">LATEST</MonoLabel>
                        <LedInline color="green" size="sm" />
                      </div>
                      <MonoLabel className="block mb-1">Quick Access Sheet</MonoLabel>
                      <h3 className="text-base font-bold uppercase tracking-tight mt-1 flex flex-wrap items-center gap-2">
                        Session {recordingSessions.data[0]?.id.slice(-6).toUpperCase()}
                        <Link
                          href={`/recordings/${recordingSessions.data[0]?.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline underline-offset-2 bg-card border border-border px-2 py-0.5 rounded shadow-sm"
                        >
                          Open Details <ExternalLink className="h-3 w-3" />
                        </Link>
                      </h3>
                      <MonoLabel className="block mt-2">
                        Recorded: {new Date(recordingSessions.data[0]?.startedAt ?? '').toLocaleString()} &bull; Tracks: {recordingSessions.data[0]?.tracks.length ?? 0}
                      </MonoLabel>
                    </AnalogInset>

                    {/* All sessions */}
                    <div className="space-y-4">
                      <MonoLabel className="block border-b border-border/40 pb-1">Reel Index Logs</MonoLabel>
                      {recordingSessions.data.map((session) => (
                        <div key={session.id} className="border border-border bg-card rounded p-4 shadow-sm hover:border-accent/30 transition-colors">
                          <div className="mb-3 flex flex-col gap-2 border-b border-border/40 pb-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <MonoLabel className="bg-popover border border-border px-2 py-0.5 rounded">
                                REEL: {session.id.slice(-6).toUpperCase()}
                              </MonoLabel>
                              <StatusBadge
                                variant={session.status === 'RECORDING' ? 'recording' : 'default'}
                              >
                                <LedInline
                                  color={session.status === 'RECORDING' ? 'red' : 'red-off'}
                                  size="sm"
                                  pulse={session.status === 'RECORDING'}
                                />
                                {session.status}
                              </StatusBadge>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                {new Date(session.startedAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                {new Date(session.startedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <MonoLabel>
                              Tracks: {session.tracks.length} | {session.tracks.every((t) => t.status === 'COMPLETED') ? 'ALL UPLOADED' : 'SYNC PENDING'}
                            </MonoLabel>
                            <Link
                              href={`/recordings/${session.id}`}
                              className="inline-flex items-center gap-1 btn-mechanical px-3 py-1 text-xs font-bold uppercase tracking-wider rounded text-secondary-foreground active:scale-95 transition-transform"
                            >
                              Inspect Tracks <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-border pt-4 flex items-start gap-2.5">
                  <LedInline color="green" size="sm" className="mt-0.5 shrink-0" />
                  <MonoLabel className="leading-relaxed">
                    SYSTEM NOTE: Ototabi aggregates raw recordings from browser client databases. If a track shows UPLOADING, the participant must open their recovery console.
                  </MonoLabel>
                </div>
              </AnalogCard>
            ) : (
              <div className="flex min-h-[480px] flex-col items-center justify-center space-y-4 border border-dashed border-border/60 bg-card/30 rounded-lg p-12 text-center">
                <Sliders className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Console Channel Muted
                  </h3>
                  <p className="mt-2 max-w-xs font-mono text-xs leading-relaxed text-muted-foreground/60">
                    Select a recording room from the active list to establish connection telemetry.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
