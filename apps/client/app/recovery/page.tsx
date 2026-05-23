'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTRPC } from '@/trpc/client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueries } from '@tanstack/react-query'
import { db } from '@/lib/localDB'
import { AnalogCard, AnalogInset } from '@/components/ui/analog-card'
import { Led, LedInline } from '@/components/ui/led'
import {
  MonoLabel,
  PanelTitle,
  NoiseBackground,
  MechButton,
} from '@/components/ui/retro-primitives'
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  ArrowLeft,
  Upload,
} from 'lucide-react'

interface PendingTrack {
  trackSid: string
  sessionId: string
  s3Key: string
  type: string
  uploadId: string
  pendingChunks: number
}

export default function RecoveryPage() {
  const router = useRouter()
  const trpc = useTRPC()

  const [pendingTracks, setPendingTracks] = useState<PendingTrack[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [retryingTracks, setRetryingTracks] = useState<Set<string>>(new Set())
  const [completedTracks, setCompletedTracks] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadLocalTracks() {
      try {
        const sessions = await db.uploadSessions.toArray()
        const tracks = await Promise.all(
          sessions.map(async (s) => {
            const chunkCount = await db.chunks
              .where('trackSid')
              .equals(s.trackSid)
              .filter((c) => c.status === 'pending' || c.status === 'failed')
              .count()
            return {
              trackSid: s.trackSid,
              sessionId: s.sessionId,
              s3Key: s.s3Key,
              type: s.type,
              uploadId: s.uploadId,
              pendingChunks: chunkCount,
            }
          }),
        )
        setPendingTracks(tracks)
      } catch (err) {
        setLocalError('Failed to read local IndexedDB storage.')
      } finally {
        setIsLoadingLocal(false)
      }
    }
    loadLocalTracks()
  }, [])

  // Resolve track IDs from server session data for each unique session
  const uniqueSessionIds = useMemo(
    () => [...new Set(pendingTracks.map((t) => t.sessionId))],
    [pendingTracks],
  )

  const sessionQueries = useQueries({
    queries: uniqueSessionIds.map((sessionId) =>
      trpc.rooms.getRecordingSessionById.queryOptions(
        { sessionId },
        { enabled: !isLoadingLocal && uniqueSessionIds.length > 0 },
      ),
    ),
  })

  // Build trackSid → trackId lookup from resolved session queries
  const trackIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const q of sessionQueries) {
      if (!q.data) continue
      for (const track of q.data.tracks) {
        map[track.trackSid] = track.id
      }
    }
    return map
  }, [sessionQueries])

  const retryMutation = useMutation(
    trpc.uploads.retryUpload.mutationOptions({
      onSuccess: (_data, variables) => {
        setRetryingTracks((prev) => {
          const next = new Set(prev)
          next.delete(variables.trackId)
          return next
        })
        setCompletedTracks((prev) => new Set(prev).add(variables.trackId))
      },
      onError: (_err, variables) => {
        setRetryingTracks((prev) => {
          const next = new Set(prev)
          next.delete(variables.trackId)
          return next
        })
      },
    }),
  )

  const handleRetry = useCallback(
    (track: PendingTrack) => {
      const trackId = trackIdMap[track.trackSid]
      if (!trackId) return
      setRetryingTracks((prev) => new Set(prev).add(trackId))
      retryMutation.mutate({ trackId })
    },
    [retryMutation, trackIdMap],
  )

  const areSessionsLoading = sessionQueries.some((q) => q.isLoading)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoadingLocal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Scanning Local Storage...
          </span>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (localError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-sm w-full">
          <AlertTriangle className="mx-auto h-12 w-12 text-led-on mb-4" />
          <p className="font-bold uppercase text-led-on tracking-wider text-sm mb-2">
            Storage Read Failure
          </p>
          <p className="font-mono text-xs text-muted-foreground mb-6 leading-normal">
            {localError}
          </p>
          <MechButton
            onClick={() => router.push('/dashboard')}
            className="w-full justify-center"
          >
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 relative">
      <NoiseBackground />

      <div className="max-w-3xl w-full mx-auto relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex items-end justify-between border-b-2 border-border pb-4">
          <div className="flex items-end gap-4">
            <MechButton
              onClick={() => router.push('/dashboard')}
              className="px-2.5 py-2 h-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl font-bold leading-none tracking-tight uppercase">
                Recovery Console
              </h1>
              <MonoLabel className="block mt-1.5">
                Local IndexedDB Pending Track Recovery
              </MonoLabel>
            </div>
          </div>
          <Led color="amber" size="md" pulse label="PENDING" />
        </header>

        {/* ── Empty State ───────────────────────────────────────────────── */}
        {pendingTracks.length === 0 ? (
          <AnalogCard className="p-12 text-center">
            <HardDrive className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <PanelTitle
              label="Storage Status"
              title="No Pending Recordings"
            />
            <p className="font-mono text-xs text-muted-foreground/60 leading-normal max-w-sm mx-auto mt-4">
              No pending recordings were found in your browser&apos;s local
              IndexedDB storage. All local tracks have been uploaded.
            </p>
            <MechButton
              onClick={() => router.push('/dashboard')}
              className="mt-6 mx-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </MechButton>
          </AnalogCard>
        ) : (
          /* ── Pending Tracks List ─────────────────────────────────────── */
          <div className="space-y-4">
            <PanelTitle
              label="Pending Tracks"
              title={`${pendingTracks.length} Track${pendingTracks.length !== 1 ? 's' : ''} Awaiting Upload`}
            />

            {areSessionsLoading ? (
              <div className="py-12 text-center font-mono text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
                RESOLVING TRACK STATUSES...
              </div>
            ) : (
              pendingTracks.map((track) => {
                const trackId = trackIdMap[track.trackSid]
                const isRetrying = trackId ? retryingTracks.has(trackId) : false
                const isCompleted = trackId ? completedTracks.has(trackId) : false
                const canRetry = !!trackId && !isRetrying && !isCompleted

                return (
                  <AnalogCard key={track.trackSid} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-popover border border-border rounded flex items-center justify-center shrink-0">
                          <HardDrive className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold uppercase text-sm tracking-tight">
                            {track.type}
                          </p>
                          <MonoLabel className="text-[9px]">
                            SID: {track.trackSid.slice(-12)}
                          </MonoLabel>
                          <MonoLabel className="text-[9px]">
                            Chunks: {track.pendingChunks}
                            {' | '}Session: {track.sessionId.slice(-8).toUpperCase()}
                          </MonoLabel>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 border border-led-green/30 bg-led-green/10 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider text-led-green">
                            <CheckCircle className="h-3 w-3" />
                            RETRY INITIATED
                          </span>
                        ) : !trackId ? (
                          <MonoLabel className="text-led-on text-[9px] whitespace-nowrap">
                            UNAVAILABLE
                          </MonoLabel>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 border border-border bg-popover px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider text-led-on">
                              <LedInline color="red" size="sm" />
                              {track.pendingChunks} PENDING
                            </span>
                            <MechButton
                              onClick={() => handleRetry(track)}
                              disabled={isRetrying}
                              className="px-3 py-1.5 h-8 text-[10px]"
                            >
                              {isRetrying ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  RETRYING
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3" />
                                  RETRY UPLOAD
                                </>
                              )}
                            </MechButton>
                          </>
                        )}
                      </div>
                    </div>
                  </AnalogCard>
                )
              })
            )}

            {/* ── System Note ──────────────────────────────────────────── */}
            <AnalogCard className="p-5 flex items-start gap-3">
              <Led color="amber" size="sm" pulse className="mt-0.5 shrink-0" />
              <div>
                <MonoLabel className="block mb-1">System Note</MonoLabel>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                  Tracks stored in IndexedDB with pending or failed chunks can be
                  retried from this console. After retry, the upload process will
                  resume from where it left off. If the track was already completed
                  on the server, no further action is needed.
                </p>
              </div>
            </AnalogCard>
          </div>
        )}
      </div>
    </div>
  )
}
