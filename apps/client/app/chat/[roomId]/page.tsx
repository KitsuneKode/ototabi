'use client'

import config from '@/utils/config'
import '@livekit/components-styles'
import { useTRPC } from '@/trpc/client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@ototabi/ui/components/button'
import { useQuery, useMutation } from '@tanstack/react-query'
import { RecorderManager } from '@/lib/recorder/recorder-manager'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTimer, formatTimer } from '@/lib/hooks/use-timer'
import {
  Room,
  RoomEvent,
  Track,
  RoomOptions,
  VideoPresets,
} from 'livekit-client'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Radio,
} from 'lucide-react'
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomContext,
  useTracks,
} from '@livekit/components-react'
import { AnalogCard, AnalogInset } from '@/components/ui/analog-card'
import { Led, LedInline } from '@/components/ui/led'
import {
  MonoLabel,
  PanelTitle,
  StatusBadge,
  NoiseBackground,
  MechButton,
} from '@/components/ui/retro-primitives'

export default function StudioPage() {
  const { roomId } = useParams() as { roomId: string }
  const searchParams = useSearchParams()
  const router = useRouter()
  const trpc = useTRPC()

  const audioEnabled = searchParams.get('audioEnabled') === 'true'
  const videoEnabled = searchParams.get('videoEnabled') === 'true'
  const micId = searchParams.get('micId') || ''
  const camId = searchParams.get('camId') || ''

  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [tokenError, setTokenError] = useState('')
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [roomDetails, setRoomDetails] = useState<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [progressMap, setProgressMap] = useState<
    Map<string, { name: string; progress: number; type: string }>
  >(new Map())
  const [connectionError, setConnectionError] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionHealth, setConnectionHealth] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected')

  const recorderManager = useRef<RecorderManager | null>(null)
  const roomInstance = useRef<Room | null>(null)

  const recordingSeconds = useTimer(isRecording)

  const authState = useQuery(trpc.auth.getSession.queryOptions())

  useEffect(() => {
    if (authState.data?.user) setSessionUser(authState.data.user)
  }, [authState.data])

  const roomInfo = useQuery(
    trpc.rooms.getRoom.queryOptions(
      { code: roomId },
      { enabled: !!roomId }
    )
  )

  useEffect(() => {
    if (roomInfo.data) setRoomDetails(roomInfo.data)
  }, [roomInfo.data])

  const startSessionMutation = useMutation(
    trpc.rooms.startRecordingSession.mutationOptions(),
  )
  const stopSessionMutation = useMutation(
    trpc.rooms.stopRecordingSession.mutationOptions(),
  )

  const room = useRef(
    new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        deviceId: camId || undefined,
        resolution: VideoPresets.h720.resolution,
      },
      audioCaptureDefaults: {
        deviceId: micId || undefined,
      },
      publishDefaults: {
        videoEncoding: {
          maxBitrate: 1_200_000,
          maxFramerate: 30,
        },
      },
    } as RoomOptions),
  ).current

  roomInstance.current = room

  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: any) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload))
        if (data.type === 'start_recording') {
          setActiveSessionId(data.sessionId)
          setIsRecording(true)
          recorderManager.current?.startRecording(data.sessionId)
        } else if (data.type === 'stop_recording') {
          setIsRecording(false)
          recorderManager.current?.stopRecording()
        } else if (data.type === 'upload_progress') {
          setProgressMap((prev) => {
            const next = new Map(prev)
            next.set(data.trackSid, {
              name: participant?.identity || 'Guest',
              progress: data.progress,
              type: data.trackSid.includes('video') ? 'VIDEO' : 'AUDIO',
            })
            return next
          })
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [],
  )

  useEffect(() => {
    if (!sessionUser || !roomId || !roomDetails) return

    let cancelled = false

    ;(async () => {
      try {
        setTokenLoading(true)
        const resp = await fetch(
          `${config.getConfig('apiBaseUrl')}/api/token?room=${roomId}&username=${encodeURIComponent(sessionUser.name || sessionUser.email)}`,
        )
        if (!resp.ok) throw new Error(`Token request failed: ${resp.status}`)
        const data = await resp.json()
        if (cancelled) return

        if (!data.token) throw new Error('No token returned from server')

        setToken(data.token)

        room.on(RoomEvent.DataReceived, handleDataReceived)
        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false)
          setConnectionHealth('disconnected')
          setConnectionError('Disconnected from studio')
        })
        room.on(RoomEvent.Reconnecting, () => {
          setConnectionHealth('reconnecting')
          setConnectionError('Reconnecting...')
        })
        room.on(RoomEvent.Reconnected, () => {
          setConnectionError('')
          setIsConnected(true)
          setConnectionHealth('connected')
        })

        await room.connect(config.getConfig('liveKitUrl'), data.token)
        if (cancelled) return

        setIsConnected(true)
        setConnectionHealth('connected')
        setTokenLoading(false)

        if (videoEnabled) await room.localParticipant.setCameraEnabled(true)
        if (audioEnabled) await room.localParticipant.setMicrophoneEnabled(true)

        recorderManager.current = new RecorderManager({ room })
      } catch (err: any) {
        if (!cancelled) {
          setTokenError(err.message || 'Failed to connect to studio')
          setTokenLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      room.off(RoomEvent.DataReceived, handleDataReceived)
      recorderManager.current?.cleanup()
      room.disconnect()
    }
  }, [sessionUser, roomId, roomDetails, handleDataReceived, room, audioEnabled, videoEnabled])

  const handleStartRecording = async () => {
    if (!roomDetails) return
    try {
      const session = await startSessionMutation.mutateAsync({
        roomId: roomDetails.id,
      })
      setActiveSessionId(session.id)
      setIsRecording(true)
      await recorderManager.current?.startRecording(session.id)

      const data = new TextEncoder().encode(
        JSON.stringify({ type: 'start_recording', sessionId: session.id }),
      )
      await room.localParticipant.publishData(data, { reliable: true })
    } catch (e) {
      console.error('Failed starting recording:', e)
    }
  }

  const handleStopRecording = async () => {
    if (!activeSessionId) return
    try {
      await stopSessionMutation.mutateAsync({ sessionId: activeSessionId })
      setIsRecording(false)
      await recorderManager.current?.stopRecording()

      const data = new TextEncoder().encode(
        JSON.stringify({ type: 'stop_recording' }),
      )
      await room.localParticipant.publishData(data, { reliable: true })
    } catch (e) {
      console.error('Failed stopping recording:', e)
    }
  }

  const isHost = roomDetails && sessionUser && roomDetails.creatorId === sessionUser.id

  // ─── Error State ────────────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-led-on/10 border border-led-on/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-led-on" />
          </div>
          <p className="font-bold uppercase text-led-on tracking-wider text-sm mb-2">Connection Fault</p>
          <p className="font-mono text-xs text-muted-foreground leading-normal mb-6">{tokenError}</p>
          <MechButton onClick={() => router.push('/dashboard')} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (tokenLoading || !roomDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <div className="space-y-1 text-center">
            <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse block">
              Synchronizing Studio Link...
            </span>
            <AnalogInset className="mx-auto h-1.5 w-48">
              <div className="h-full w-2/3 bg-accent/60 animate-pulse rounded" />
            </AnalogInset>
          </div>
        </div>
      </div>
    )
  }

  // ─── Studio Main UI ──────────────────────────────────────────────────────────
  return (
    <RoomContext.Provider value={room}>
      <NoiseBackground />

      <div className="flex h-screen flex-col overflow-hidden bg-background font-sans text-foreground relative z-10">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="z-10 flex shrink-0 items-center justify-between border-b-2 border-border bg-card px-5 py-3 shadow-[0_4px_0_0_var(--color-border)]">
          <div className="flex items-center gap-4">
            <MechButton onClick={() => router.push('/dashboard')} className="h-9 w-9" title="Return to Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wide text-foreground leading-none">
                Studio:{' '}
                <span className="text-muted-foreground">{roomDetails.name}</span>
              </h1>
              <div className="mt-0.5 flex items-center gap-1.5">
                <MonoLabel>
                  Join Code: <span className="text-foreground">{roomDetails.code}</span>
                  {' | '}Op: {sessionUser?.name}
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

          <div className="flex items-center gap-3">
            {/* Connection health LED */}
            <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
              <Led
                color={connectionHealth === 'connected' ? 'green' : connectionHealth === 'reconnecting' ? 'amber' : 'red'}
                size="sm"
                pulse={connectionHealth === 'reconnecting'}
              />
              <MonoLabel>
                {connectionHealth === 'connected' ? 'LIVE'
                  : connectionHealth === 'reconnecting' ? 'SYNC'
                  : 'LOST'}
              </MonoLabel>
            </AnalogInset>

            {connectionError && (
              <div className="flex items-center gap-1.5 border border-yellow-600/40 bg-yellow-400/10 px-3 py-1.5 rounded">
                <MonoLabel className="text-yellow-600 dark:text-yellow-400">{connectionError}</MonoLabel>
              </div>
            )}

            {isRecording && (
              <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
                <Led color="red" size="sm" pulse />
                <MonoLabel className="text-led-on tabular-nums">
                  REC // {formatTimer(recordingSeconds)}
                </MonoLabel>
              </AnalogInset>
            )}

            {isHost && (
              <div className="flex items-center">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    className="btn-mechanical h-9 rounded text-[10px] font-bold uppercase tracking-widest text-secondary-foreground px-5"
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    className="h-9 bg-led-on/90 hover:bg-led-on border border-led-on/60 text-white shadow-[0_3px_5px_rgba(0,0,0,0.2),0_0_10px_var(--color-led-on)] rounded text-[10px] font-bold uppercase tracking-widest active:translate-y-[2px] transition-[transform,box-shadow] ease-[var(--ease-mechanical)] duration-150 px-5"
                  >
                    Stop Recording
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Main Layout ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Video feed area */}
          <main className="relative flex min-w-0 flex-1 flex-col bg-[#111] overflow-hidden">
            {/* CRT scanline overlay on the entire video area */}
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-20"
              style={{
                background: 'linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%)',
                backgroundSize: '100% 4px',
              }}
            />

            {/* Corner label */}
            <div className="absolute top-3 left-3 z-20 font-mono text-[9px] text-[#888] uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded border border-white/10">
              CH 1 : Studio Feed
            </div>

            <div className="flex min-h-0 w-full flex-1 items-center justify-center p-4">
              <StudioVideoConference />
            </div>
            <RoomAudioRenderer />
          </main>

          {/* ── Sidebar: Upload Monitor (host only) or Guest Progress ─────────── */}
          {isHost ? (
            <aside className="hidden w-72 flex-col overflow-y-auto border-l-2 border-border bg-card p-4 shadow-[-4px_0_0_0_var(--color-border)] lg:flex">
              <PanelTitle label="Track Upload Queues" title="Upload Monitor" className="mb-4 pb-3 border-b border-border" />

              {progressMap.size === 0 ? (
                <AnalogInset className="flex flex-1 flex-col items-center justify-center gap-3 border-dashed p-6 text-center">
                  <Radio className="h-8 w-8 animate-pulse text-muted-foreground/30" />
                  <div className="space-y-1">
                    <MonoLabel className="block">Standby Mode</MonoLabel>
                    <p className="max-w-[160px] font-mono text-[8px] text-muted-foreground/60 leading-normal uppercase">
                      Upload feeds populate once recorders activate.
                    </p>
                  </div>
                </AnalogInset>
              ) : (
                <div className="space-y-3.5">
                  {Array.from(progressMap.entries()).map(([trackSid, data]) => (
                    <AnalogInset key={trackSid} className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="max-w-[120px] truncate text-xs font-bold text-foreground uppercase">
                          {data.name}
                        </span>
                        <StatusBadge className="text-[8px]">
                          {data.type}
                        </StatusBadge>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <AnalogInset className="h-2 flex-1 p-0">
                          <div
                            className={`h-full transition-[width] duration-300 rounded-sm ${
                              data.progress === 100
                                ? 'bg-led-green shadow-[0_0_5px_var(--color-led-green)]'
                                : 'bg-accent shadow-[0_0_5px_var(--color-accent-glow)]'
                            }`}
                            style={{ width: `${data.progress}%` }}
                          />
                        </AnalogInset>
                        <span className="min-w-[32px] text-right font-mono text-[10px] font-bold tabular-nums text-foreground">
                          {data.progress}%
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between font-mono text-[8px] text-muted-foreground/60">
                        <span className="max-w-[140px] truncate uppercase">
                          SID: {trackSid.slice(-10)}
                        </span>
                        {data.progress === 100 && (
                          <span className="flex items-center gap-0.5 text-led-green font-bold">
                            <CheckCircle className="h-3 w-3 shrink-0" />
                            <span>SAVED</span>
                          </span>
                        )}
                      </div>
                    </AnalogInset>
                  ))}
                </div>
              )}
            </aside>
          ) : (
            /* Guest upload sidebar — own tracks only */
            progressMap.size > 0 && (
              <aside className="hidden w-64 flex-col overflow-y-auto border-l-2 border-border bg-card p-4 shadow-[-4px_0_0_0_var(--color-border)] lg:flex">
                <PanelTitle label="Your Tracks" title="Upload Status" className="mb-4 pb-3 border-b border-border" />
                <div className="space-y-3.5">
                  {Array.from(progressMap.entries())
                    .filter(([, d]) => d.name === sessionUser?.name)
                    .map(([trackSid, data]) => (
                      <AnalogInset key={trackSid} className="p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <MonoLabel className="text-[8px]">{data.type}</MonoLabel>
                          {data.progress === 100 && (
                            <span className="flex items-center gap-0.5 text-led-green font-mono font-bold text-[8px]">
                              <CheckCircle className="h-3 w-3" />
                              <span>DONE</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <AnalogInset className="h-2 flex-1 p-0">
                            <div
                              className={`h-full transition-[width] duration-300 rounded-sm ${
                                data.progress === 100 ? 'bg-led-green' : 'bg-accent'
                              }`}
                              style={{ width: `${data.progress}%` }}
                            />
                          </AnalogInset>
                          <span className="font-mono text-[10px] font-bold tabular-nums">{data.progress}%</span>
                        </div>
                      </AnalogInset>
                    ))}
                </div>
              </aside>
            )
          )}
        </div>

        {/* ── Control Footer ──────────────────────────────────────────────────── */}
        <footer className="z-10 flex h-16 shrink-0 items-center justify-center border-t-2 border-border bg-card shadow-[0_-4px_0_0_var(--color-border)]">
          <ControlBar variation="minimal" />
        </footer>
      </div>
    </RoomContext.Provider>
  )
}

function StudioVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  return (
    <GridLayout
      tracks={tracks}
      className="h-full w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ParticipantTile className="overflow-hidden rounded border-2 border-border/60 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
    </GridLayout>
  )
}
