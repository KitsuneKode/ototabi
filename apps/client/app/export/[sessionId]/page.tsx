'use client'

import { useRef, useState, useCallback } from 'react'
import { useTRPC } from '@/trpc/client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'
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
  Scissors,
  Combine,
} from 'lucide-react'

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
}

type ProcessingStatus = 'idle' | 'loading-ffmpeg' | 'processing' | 'done' | 'error'
type ProcessingMode = 'merge' | 'trim' | '720p' | '1080p' | null

async function downloadFile(ffmpeg: FFmpeg, filename: string, downloadName: string) {
  const fileData = await ffmpeg.readFile(filename)
  const blob = new Blob([fileData as unknown as BlobPart], { type: 'video/mp4' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName
  a.click()
  URL.revokeObjectURL(url)
  await ffmpeg.deleteFile(filename)
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

export default function ExportSessionPage() {
  const { sessionId } = useParams() as { sessionId: string }
  const router = useRouter()
  const trpc = useTRPC()

  const ffmpegRef = useRef(new FFmpeg())
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle')
  const [processingMode, setProcessingMode] = useState<ProcessingMode>(null)
  const [progress, setProgress] = useState(0)
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
  const [trimStart, setTrimStart] = useState('')
  const [trimEnd, setTrimEnd] = useState('')
  const [trimTrackId, setTrimTrackId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const session = useQuery(
    trpc.rooms.getRecordingSessionById.queryOptions({ sessionId }, { enabled: !!sessionId }),
  )

  const loadFfmpeg = useCallback(async () => {
    if (ffmpegLoaded) return
    setProcessingStatus('loading-ffmpeg')
    setErrorMessage('')
    try {
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm'
      const ffmpeg = ffmpegRef.current

      ffmpeg.on('progress', ({ progress: p }: { progress: number }) => {
        setProgress(Math.round(p * 100))
      })

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })

      setFfmpegLoaded(true)
      setProcessingStatus('idle')
    } catch (err) {
      setProcessingStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load FFmpeg')
    }
  }, [ffmpegLoaded])

  const toggleTrack = useCallback((trackId: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })
  }, [])

  const handleMerge = useCallback(async () => {
    if (!session.data) return
    const tracks = session.data.tracks.filter(
      (t) => selectedTracks.has(t.id) && t.status === 'COMPLETED' && t.s3Url,
    )
    if (tracks.length < 2) return

    setProcessingMode('merge')
    setProcessingStatus('processing')
    setProgress(0)
    setErrorMessage('')

    try {
      await loadFfmpeg()
      const ffmpeg = ffmpegRef.current

      let content = ''
      for (let i = 0; i < tracks.length; i++) {
        const name = `input_${i}.mp4`
        const data = await fetchFile(tracks[i]!.s3Url!)
        await ffmpeg.writeFile(name, data)
        content += `file '${name}'\n`
      }

      await ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(content))
      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', '-c', 'copy', 'output.mp4'])

      await downloadFile(ffmpeg, 'output.mp4', `session-${sessionId.slice(-8)}-merged.mp4`)

      for (let i = 0; i < tracks.length; i++) {
        await ffmpeg.deleteFile(`input_${i}.mp4`)
      }
      await ffmpeg.deleteFile('concat_list.txt')

      setProcessingStatus('done')
    } catch (err) {
      setProcessingStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Merge failed')
    }
  }, [session.data, selectedTracks, loadFfmpeg, sessionId])

  const handleExportRes = useCallback(async (resolution: '720p' | '1080p') => {
    if (!session.data) return
    const tracks = session.data.tracks.filter(
      (t) => selectedTracks.has(t.id) && t.status === 'COMPLETED' && t.s3Url,
    )
    if (tracks.length === 0) return

    const mode = resolution === '720p' ? '720p' : '1080p'
    setProcessingMode(mode)
    setProcessingStatus('processing')
    setProgress(0)
    setErrorMessage('')

    try {
      await loadFfmpeg()
      const ffmpeg = ffmpegRef.current

      let content = ''
      const scale = resolution === '720p' ? '1280:720' : '1920:1080'

      for (let i = 0; i < tracks.length; i++) {
        const name = `input_${i}.mp4`
        const data = await fetchFile(tracks[i]!.s3Url!)
        await ffmpeg.writeFile(name, data)
        content += `file '${name}'\n`
      }

      await ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(content))
      await ffmpeg.exec([
        '-f', 'concat', '-safe', '0', '-i', 'concat_list.txt',
        '-vf', `scale=${scale}`,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        'output.mp4',
      ])

      await downloadFile(ffmpeg, 'output.mp4', `session-${sessionId.slice(-8)}-${resolution}.mp4`)

      for (let i = 0; i < tracks.length; i++) {
        await ffmpeg.deleteFile(`input_${i}.mp4`)
      }
      await ffmpeg.deleteFile('concat_list.txt')

      setProcessingStatus('done')
    } catch (err) {
      setProcessingStatus('error')
      setErrorMessage(err instanceof Error ? err.message : `${resolution} export failed`)
    }
  }, [session.data, selectedTracks, loadFfmpeg, sessionId])

  const handleTrim = useCallback(async () => {
    if (!trimTrackId || !trimStart && !trimEnd) return

    setProcessingMode('trim')
    setProcessingStatus('processing')
    setProgress(0)
    setErrorMessage('')

    try {
      await loadFfmpeg()
      const ffmpeg = ffmpegRef.current

      const track = session.data?.tracks.find((t) => t.id === trimTrackId)
      if (!track?.s3Url) throw new Error('Track not found')

      const data = await fetchFile(track.s3Url)
      await ffmpeg.writeFile('input.mp4', data)

      const args = ['-i', 'input.mp4']
      if (trimStart) args.push('-ss', String(Number(trimStart)))
      if (trimEnd) {
        const duration = trimEnd
        args.push('-to', duration)
      }
      args.push('-c', 'copy', 'output.mp4')

      await ffmpeg.exec(args)

      await downloadFile(ffmpeg, 'output.mp4', `session-${sessionId.slice(-8)}-trim.mp4`)

      await ffmpeg.deleteFile('input.mp4')

      setProcessingStatus('done')
    } catch (err) {
      setProcessingStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Trim failed')
    }
  }, [trimTrackId, trimStart, trimEnd, session.data, loadFfmpeg, sessionId])

  const procColor = processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'
    ? 'amber' as const
    : processingStatus === 'done' ? 'green' as const
    : processingStatus === 'error' ? 'red' as const
    : 'green-off' as const

  const procLabel = processingStatus === 'loading-ffmpeg' ? 'LOADING FFMPEG'
    : processingStatus === 'processing' ? `${processingMode?.toUpperCase()} ${progress}%`
    : processingStatus === 'done' ? 'COMPLETE'
    : processingStatus === 'error' ? 'ERROR'
    : 'STANDBY'

  // ── Loading ──────────────────────────────────────────────────────────────
  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Initializing Export Console...
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
            Export session &ldquo;{sessionId.slice(-8).toUpperCase()}&rdquo; could not be located.
          </p>
          <MechButton onClick={() => router.push('/dashboard')} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  const data = session.data
  const completedTracks = data.tracks.filter((t) => t.status === 'COMPLETED')

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
                Export Console
              </h1>
              <MonoLabel className="block mt-1.5">
                SESSION: {data.id.slice(-8).toUpperCase()} // {data.room.name}
              </MonoLabel>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Led color={procColor} size="sm" pulse={processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'} />
            <StatusBadge variant={
              processingStatus === 'processing' || processingStatus === 'loading-ffmpeg' ? 'warn'
              : processingStatus === 'done' ? 'ok'
              : processingStatus === 'error' ? 'recording'
              : 'default'
            }>
              {procLabel}
            </StatusBadge>
          </div>
        </header>

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Session ID', value: data.id.slice(-8).toUpperCase(), accent: true },
              { label: 'Room Code', value: data.room.code, accent: false },
              { label: 'Started At', value: new Date(data.startedAt).toLocaleString(), accent: false },
              { label: 'Total Tracks', value: String(data.tracks.length), accent: true },
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

        {/* ── Tracks Section ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <PanelTitle label="Source Tapes" title="Select Tracks" />

          {data.tracks.length === 0 ? (
            <AnalogCard className="p-12 text-center">
              <Combine className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <MonoLabel className="block mb-2">No Tracks Available</MonoLabel>
              <p className="font-mono text-xs text-muted-foreground/60 leading-normal max-w-sm mx-auto">
                This session has no recorded tracks to export.
              </p>
            </AnalogCard>
          ) : (
            <div className="space-y-2">
              {data.tracks.map((track) => {
                const Icon = TRACK_TYPE_ICON[track.type] ?? Mic
                const isCompleted = track.status === 'COMPLETED' && !!track.s3Url
                const checked = selectedTracks.has(track.id)

                return (
                  <AnalogInset key={track.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!isCompleted}
                            onChange={() => toggleTrack(track.id)}
                            className="h-4 w-4 accent-accent"
                          />
                          <div className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </label>
                        <div>
                          <p className="font-bold uppercase text-sm tracking-tight">{track.type}</p>
                          <MonoLabel className="text-[9px]">
                            {track.user?.name ?? track.user?.email ?? 'Unknown'}
                          </MonoLabel>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TrackStatusBadge status={track.status} />

                        {isCompleted ? (
                          <a
                            href={track.s3Url!}
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
                  </AnalogInset>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Merge / Export Section ────────────────────────────────────── */}
        {completedTracks.length > 0 && (
          <AnalogCard className="p-6">
            <PanelTitle label="Mastering Suite" title="Merge & Export" className="mb-5" />

            {errorMessage && (
              <div className="mb-4 p-3 border border-led-on/30 bg-led-on/5 rounded flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-led-on" />
                <p className="font-mono text-[10px] text-led-on leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <MechButton
                onClick={handleMerge}
                disabled={selectedTracks.size < 2 || processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Combine className="h-3.5 w-3.5" />
                Merge Selected Tracks
              </MechButton>

              <MechButton
                onClick={() => handleExportRes('720p')}
                disabled={selectedTracks.size === 0 || processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                Export 720p
              </MechButton>

              <MechButton
                onClick={() => handleExportRes('1080p')}
                disabled={selectedTracks.size === 0 || processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                Export 1080p
              </MechButton>
            </div>

            {/* Progress bar */}
            {(processingStatus === 'processing' || processingStatus === 'loading-ffmpeg') && (
              <div className="mt-5">
                <AnalogInset className="h-2 flex items-stretch p-0.5">
                  <div
                    className="rounded-sm transition-all duration-300"
                    style={{
                      width: `${processingStatus === 'loading-ffmpeg' ? 30 : progress}%`,
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                </AnalogInset>
              </div>
            )}
          </AnalogCard>
        )}

        {/* ── Trim Section ──────────────────────────────────────────────── */}
        {completedTracks.length > 0 && (
          <AnalogCard className="p-6">
            <PanelTitle label="Splicing Deck" title="Trim Clip" className="mb-5" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-track" className="block mb-1.5">Select Track</MonoLabel>
                <select
                  id="trim-track"
                  value={trimTrackId ?? ''}
                  onChange={(e) => setTrimTrackId(e.target.value || null)}
                  className="w-full bg-card border border-border rounded px-2 py-1.5 font-mono text-xs uppercase focus:outline-none focus:border-accent"
                >
                  <option value="">— Select —</option>
                  {completedTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type} — {t.user?.name ?? t.user?.email ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </AnalogInset>

              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-start" className="block mb-1.5">Skip Start (s)</MonoLabel>
                <input
                  id="trim-start"
                  type="number"
                  min="0"
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  placeholder="0"
                  className="w-full bg-card border border-border rounded px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none focus:border-accent"
                />
              </AnalogInset>

              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-end" className="block mb-1.5">End Time (s)</MonoLabel>
                <input
                  id="trim-end"
                  type="number"
                  min="0"
                  step="0.5"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  placeholder="0"
                  className="w-full bg-card border border-border rounded px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none focus:border-accent"
                />
              </AnalogInset>
            </div>

            <MechButton
              onClick={handleTrim}
              disabled={!trimTrackId || (!trimStart && !trimEnd) || processingStatus === 'processing' || processingStatus === 'loading-ffmpeg'}
              className="mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Scissors className="h-3.5 w-3.5" />
              Apply Trim
            </MechButton>

            {errorMessage && processingMode === 'trim' && (
              <div className="mt-4 p-3 border border-led-on/30 bg-led-on/5 rounded flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-led-on" />
                <p className="font-mono text-[10px] text-led-on leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </AnalogCard>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <MechButton onClick={() => router.push(`/recordings/${sessionId}`)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Session Review
          </MechButton>
        </div>
      </div>
    </div>
  )
}
