'use client'

import { useTRPC } from '@/trpc/client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
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
  Download,
  Mic,
  Video,
  Monitor,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Film,
} from 'lucide-react'

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
}

function TrackStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <StatusBadge variant="ok">
        <LedInline color="green" size="sm" />
        UPLOADED
      </StatusBadge>
    )
  }
  if (status === 'UPLOADING') {
    return (
      <StatusBadge variant="warn">
        <LedInline color="amber" size="sm" pulse />
        UPLOADING
      </StatusBadge>
    )
  }
  return (
    <StatusBadge variant="recording">
      <LedInline color="red" size="sm" />
      FAILED
    </StatusBadge>
  )
}

export default function RecordingSessionPage() {
  const { sessionId } = useParams() as { sessionId: string }
  const router = useRouter()
  const trpc = useTRPC()

  const session = useQuery(
    trpc.rooms.getRecordingSessionById.queryOptions({ sessionId }, { enabled: !!sessionId }),
  )

  // ── Loading ──────────────────────────────────────────────────────────────
  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Loading Session Tapes...
          </span>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (session.error || !session.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-sm w-full">
          <AlertTriangle className="mx-auto h-12 w-12 text-led-on mb-4" />
          <p className="font-bold uppercase text-led-on tracking-wider text-sm mb-2">Session Not Found</p>
          <p className="font-mono text-xs text-muted-foreground mb-6 leading-normal">
            Recording session &ldquo;{sessionId.slice(-8).toUpperCase()}&rdquo; could not be located.
          </p>
          <MechButton onClick={() => router.push('/dashboard')} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  const data = session.data
  const allUploaded = data.tracks.every((t) => t.status === 'COMPLETED')
  const totalTracks = data.tracks.length

  // Group tracks by participant
  const byUser = data.tracks.reduce<Record<string, typeof data.tracks>>((acc, track) => {
    const key = track.user?.name ?? track.user?.email ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(track)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 relative">
      <NoiseBackground />

      <div className="max-w-5xl w-full mx-auto relative z-10 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-border pb-4 gap-4">
          <div className="flex items-end gap-4">
            <MechButton onClick={() => router.push('/dashboard')} className="px-2.5 py-2 h-9">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl font-bold leading-none tracking-tight uppercase">
                Session Review
              </h1>
              <MonoLabel className="block mt-1.5">
                REEL: {data.id.slice(-8).toUpperCase()} // {data.room.name}
              </MonoLabel>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant={allUploaded ? 'ok' : 'warn'}>
              <LedInline
                color={allUploaded ? 'green' : 'amber'}
                size="sm"
                pulse={!allUploaded}
              />
              {allUploaded ? 'ALL UPLOADED' : 'SYNC PENDING'}
            </StatusBadge>
          </div>
        </header>

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: 'Session ID',
                value: data.id.slice(-8).toUpperCase(),
                accent: true,
              },
              {
                label: 'Room Code',
                value: data.room.code,
                accent: false,
              },
              {
                label: 'Started At',
                value: new Date(data.startedAt).toLocaleString(),
                accent: false,
              },
              {
                label: 'Total Tracks',
                value: String(totalTracks),
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <AnalogInset key={label} className="p-4 flex flex-col gap-1.5">
                <MonoLabel>{label}</MonoLabel>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${accent ? 'text-accent' : 'text-foreground'}`}
                >
                  {value}
                </span>
              </AnalogInset>
            ))}
          </div>
        </AnalogCard>

        {/* ── Tracks by Participant ─────────────────────────────────────── */}
        <div className="space-y-6">
          <PanelTitle label="Multi-Track Index" title="Participant Recordings" />

          {totalTracks === 0 ? (
            <AnalogCard className="p-12 text-center">
              <Film className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <MonoLabel className="block mb-2">No Tracks Registered</MonoLabel>
              <p className="font-mono text-xs text-muted-foreground/60 leading-normal max-w-sm mx-auto">
                Participants must upload their local recordings to populate this index.
              </p>
            </AnalogCard>
          ) : (
            Object.entries(byUser).map(([userName, tracks]) => {
              const userUploaded = tracks.every((t) => t.status === 'COMPLETED')
              return (
                <AnalogCard key={userName} className="p-6">
                  {/* Participant header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-popover border border-border rounded flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-tight text-sm">{userName}</p>
                        <MonoLabel>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</MonoLabel>
                      </div>
                    </div>
                    <StatusBadge variant={userUploaded ? 'ok' : 'warn'}>
                      <LedInline color={userUploaded ? 'green' : 'amber'} size="sm" pulse={!userUploaded} />
                      {userUploaded ? 'COMPLETE' : 'PENDING'}
                    </StatusBadge>
                  </div>

                  {/* Track list */}
                  <div className="space-y-3">
                    {tracks.map((track) => {
                      const Icon = TRACK_TYPE_ICON[track.type] ?? Mic
                      return (
                        <AnalogInset key={track.id} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-bold uppercase text-sm tracking-tight">{track.type}</p>
                                <MonoLabel className="text-[9px]">
                                  SID: {track.trackSid.slice(-12)}
                                </MonoLabel>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <TrackStatusBadge status={track.status} />

                              {track.status === 'COMPLETED' && track.s3Url ? (
                                <a
                                  href={track.s3Url}
                                  download
                                  className="inline-flex items-center gap-1.5 btn-mechanical px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded text-secondary-foreground"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </a>
                              ) : track.status === 'UPLOADING' ? (
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Progress</span>
                                </div>
                              ) : (
                                <MonoLabel className="text-led-on text-[9px]">Upload Required</MonoLabel>
                              )}
                            </div>
                          </div>

                          {/* Upload progress bar for uploading tracks */}
                          {track.status === 'UPLOADING' && (
                            <div className="mt-3">
                              <AnalogInset className="h-2 flex items-stretch p-0.5">
                                <div
                                  className="rounded-sm animate-pulse"
                                  style={{
                                    width: '60%',
                                    backgroundColor: 'var(--accent)',
                                  }}
                                />
                              </AnalogInset>
                            </div>
                          )}
                        </AnalogInset>
                      )
                    })}
                  </div>
                </AnalogCard>
              )
            })
          )}
        </div>

        {/* ── Session Footer Note ───────────────────────────────────────── */}
        <AnalogCard className="p-5 flex items-start gap-3">
          <Led color="green" size="sm" className="mt-0.5 shrink-0" />
          <div>
            <MonoLabel className="block mb-1">System Note</MonoLabel>
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Tracks are uploaded directly from participants&apos; browser IndexedDB storage. If a participant closed their tab before upload completed, they must reopen the recording recovery console to resume. Download links are valid after full upload completion.
            </p>
          </div>
        </AnalogCard>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <Link
            href={`/rooms/${data.room.code}/settings`}
            className="font-mono text-xs text-muted-foreground hover:text-accent transition-colors uppercase tracking-widest font-bold"
          >
            Room Settings →
          </Link>
        </div>
      </div>
    </div>
  )
}
