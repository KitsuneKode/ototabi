'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { Label } from '@ototabi/ui/components/label'
import { AnalogCard, AnalogInset } from '@/components/ui/analog-card'
import { Led, LedInline } from '@/components/ui/led'
import {
  MonoLabel,
  NoiseBackground,
  MechButton,
} from '@/components/ui/retro-primitives'
import {
  Mic,
  Video,
  ArrowRight,
  Info,
  AlertTriangle,
  RefreshCw,
  VideoOff,
  Tv,
} from 'lucide-react'

export default function RoomJoinPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  const trpc = useTRPC()

  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [screenShareEnabled, setScreenShareEnabled] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedCam, setSelectedCam] = useState('')
  const [micError, setMicError] = useState('')
  const [camError, setCamError] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const roomInfo = useQuery(
    trpc.rooms.getRoom.queryOptions({ code: roomId }, { enabled: !!roomId }),
  )

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audio = devices.filter((d) => d.kind === 'audioinput')
      const video = devices.filter((d) => d.kind === 'videoinput')
      setAudioDevices(audio)
      setVideoDevices(video)
      if (audio.length > 0 && !selectedMic && audio[0]) setSelectedMic(audio[0].deviceId)
      if (video.length > 0 && !selectedCam && video[0]) setSelectedCam(video[0].deviceId)
    } catch {
      setMicError('Could not enumerate media devices')
    }
  }, [selectedMic, selectedCam])

  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: true })
      .then((s) => { s.getTracks().forEach((t) => t.stop()); enumerateDevices() })
      .catch(() => enumerateDevices())
  }, [enumerateDevices])

  useEffect(() => {
    let activeStream: MediaStream | null = null
    let animId: number
    let audioCtx: AudioContext | null = null

    const getMedia = async () => {
      try {
        if (!audioEnabled && !videoEnabled) { setStream(null); setAudioLevel(0); return }

        const constraints: MediaStreamConstraints = {
          audio: audioEnabled ? (selectedMic ? { deviceId: selectedMic } : true) : false,
          video: videoEnabled ? (selectedCam ? { deviceId: selectedCam } : true) : false,
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        activeStream = mediaStream
        setStream(mediaStream)
        if (videoRef.current) videoRef.current.srcObject = mediaStream

        if (audioEnabled && mediaStream.getAudioTracks().length > 0) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const src = audioCtx.createMediaStreamSource(mediaStream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          src.connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)
          const tick = () => {
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            setAudioLevel(Math.min(Math.round((avg / 80) * 100), 100))
            animId = requestAnimationFrame(tick)
          }
          tick()
        }
      } catch {
        if (audioEnabled) setMicError('Microphone permission or device error')
        if (videoEnabled) setCamError('Camera permission or device error')
      }
    }

    getMedia()
    return () => {
      activeStream?.getTracks().forEach((t) => t.stop())
      if (animId) cancelAnimationFrame(animId)
      if (audioCtx?.state !== 'closed') audioCtx?.close()
    }
  }, [audioEnabled, videoEnabled, selectedMic, selectedCam])

  const joinRoom = useCallback(() => {
    const params = new URLSearchParams({
      audioEnabled: String(audioEnabled),
      videoEnabled: String(videoEnabled),
      screenShareEnabled: String(screenShareEnabled),
      micId: selectedMic,
      camId: selectedCam,
    })
    router.push(`/chat/${roomId}?${params.toString()}`)
  }, [audioEnabled, videoEnabled, screenShareEnabled, selectedMic, selectedCam, roomId, router])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (roomInfo.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-accent animate-spin" />
          <span className="font-mono text-xs uppercase font-bold tracking-widest animate-pulse">
            Engaging Calibration Sequence...
          </span>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (roomInfo.error || !roomInfo.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 font-sans">
        <AnalogCard className="p-8 text-center max-w-md w-full">
          <AlertTriangle className="mx-auto h-12 w-12 text-led-on mb-4" />
          <p className="mb-2 text-lg font-bold uppercase text-led-on tracking-wider">
            Reel Not Located
          </p>
          <p className="mb-6 font-mono text-xs text-muted-foreground leading-normal">
            The studio join code &ldquo;{roomId}&rdquo; is unrecognized or has expired.
          </p>
          <MechButton onClick={() => router.push('/dashboard')} className="w-full justify-center">
            Back to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8 flex flex-col justify-center items-center relative overflow-hidden">
      <NoiseBackground />

      <div className="relative z-10 w-full max-w-4xl">
        <AnalogCard className="p-6 md:p-8 flex flex-col md:grid md:grid-cols-12 gap-8 overflow-hidden">

          {/* ── Left: CRT Live Preview Panel ────────────────────────────── */}
          <div className="md:col-span-7 bg-popover border border-border rounded p-5 flex flex-col justify-between min-h-[320px] md:min-h-[440px] shadow-inner">
            <div className="space-y-4">
              {/* Panel header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LedInline color="green" pulse />
                  <MonoLabel>CH 1 : CALIBRATION</MonoLabel>
                </div>
                <MonoLabel className="bg-card/60 px-2 py-0.5 border border-border rounded">
                  Room: {roomInfo.data.name}
                </MonoLabel>
              </div>

              {/* CRT video display */}
              <div className="scanlines relative w-full aspect-video bg-[#111] border-4 border-[#1a1a1a] rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
                {videoEnabled && stream?.getVideoTracks().length ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] relative z-10" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 relative z-10">
                    <div className="p-3 rounded-full bg-card/30 border border-border text-muted-foreground/60">
                      <VideoOff className="h-8 w-8" />
                    </div>
                    <p className="font-mono text-xs uppercase font-bold text-muted-foreground/60">
                      CAMERA DIAL DISENGAGED
                    </p>
                  </div>
                )}
                {/* Status overlay */}
                <div className="absolute bottom-3 left-3 bg-black/80 border border-white/10 px-2 py-0.5 rounded font-mono text-[8px] text-zinc-300 flex items-center gap-1.5 z-20">
                  <LedInline color={videoEnabled ? 'green' : 'red'} size="sm" />
                  FEED: {videoEnabled ? 'ACTIVE' : 'MUTED'}
                </div>
              </div>
            </div>

            {/* Audio level meter */}
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <MonoLabel className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5" /> MIC AUDIO LEVEL
                </MonoLabel>
                <MonoLabel className={audioLevel > 50 ? 'text-accent' : ''}>
                  {audioLevel}%
                </MonoLabel>
              </div>
              <AnalogInset className="h-3 flex items-stretch p-0.5">
                <div
                  className="rounded-sm transition-[width] duration-75"
                  style={{
                    width: `${audioEnabled ? audioLevel : 0}%`,
                    backgroundColor: 'var(--color-led-on)',
                    boxShadow: audioEnabled && audioLevel > 0 ? '0 0 5px var(--color-led-on)' : 'none',
                  }}
                />
              </AnalogInset>
              <MonoLabel className="text-[9px] leading-normal">
                Establish modulation peak verification before studio connection.
              </MonoLabel>
            </div>
          </div>

          {/* ── Right: Setup Controls ─────────────────────────────────── */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight">Console Settings</h2>
                <MonoLabel className="block mt-0.5">Configure your deck inputs</MonoLabel>
              </div>

              {/* Mic Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mic-select" className="font-mono text-xs uppercase font-bold text-foreground/80 tracking-wider">
                    Microphone Input
                  </Label>
                  <button
                    onClick={() => setAudioEnabled((v) => !v)}
                    className={`border px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-[background-color,border-color] uppercase tracking-wider ${
                      audioEnabled
                        ? 'bg-led-green/10 text-led-green border-led-green/30'
                        : 'bg-led-on/10 text-led-on border-led-on/30'
                    }`}
                  >
                    {audioEnabled ? 'ENGAGED' : 'MUTED'}
                  </button>
                </div>
                {audioEnabled ? (
                  <select
                    id="mic-select"
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full h-10 border border-border bg-popover px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/60 rounded font-mono shadow-inner"
                  >
                    {audioDevices.length === 0 ? (
                      <option value="">Searching for devices...</option>
                    ) : (
                      audioDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <AnalogInset className="h-10 flex items-center justify-center border-dashed">
                    <MonoLabel className="text-[10px]">Mic Stream Terminated</MonoLabel>
                  </AnalogInset>
                )}
                {micError && <MonoLabel className="text-led-on text-[9px]">{micError}</MonoLabel>}
              </div>

              {/* Camera Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cam-select" className="font-mono text-xs uppercase font-bold text-foreground/80 tracking-wider">
                    Camera Source
                  </Label>
                  <button
                    onClick={() => setVideoEnabled((v) => !v)}
                    className={`border px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-[background-color,border-color] uppercase tracking-wider ${
                      videoEnabled
                        ? 'bg-led-green/10 text-led-green border-led-green/30'
                        : 'bg-led-on/10 text-led-on border-led-on/30'
                    }`}
                  >
                    {videoEnabled ? 'ENGAGED' : 'MUTED'}
                  </button>
                </div>
                {videoEnabled ? (
                  <select
                    id="cam-select"
                    value={selectedCam}
                    onChange={(e) => setSelectedCam(e.target.value)}
                    className="w-full h-10 border border-border bg-popover px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/60 rounded font-mono shadow-inner"
                  >
                    {videoDevices.length === 0 ? (
                      <option value="">Searching for devices...</option>
                    ) : (
                      videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <AnalogInset className="h-10 flex items-center justify-center border-dashed">
                    <MonoLabel className="text-[10px]">Camera Stream Terminated</MonoLabel>
                  </AnalogInset>
                )}
                {camError && <MonoLabel className="text-led-on text-[9px]">{camError}</MonoLabel>}
              </div>

              {/* Screen Share Toggle */}
              <div className="space-y-2 pt-1">
                <MonoLabel className="block">Additional Feeds</MonoLabel>
                <button
                  onClick={() => setScreenShareEnabled((v) => !v)}
                  className={`w-full h-10 border rounded flex items-center justify-between px-3 transition-[border-color,background-color] font-mono text-xs uppercase font-bold tracking-wider ${
                    screenShareEnabled
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    <span>Screen Capture Link</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${screenShareEnabled ? 'bg-accent border-accent' : 'bg-popover border-border'}`}>
                    {screenShareEnabled && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Join Button */}
            <div className="pt-6 border-t border-border mt-6 space-y-4">
              <MechButton
                onClick={joinRoom}
                className="w-full h-12 justify-center text-sm gap-3"
              >
                <span>Connect Studio Deck</span>
                <ArrowRight className="h-4 w-4" />
              </MechButton>
              <div className="flex items-start gap-2 font-mono text-[9px] text-muted-foreground leading-relaxed uppercase">
                <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <span>
                  By joining, you authorize Ototabi to buffer your high-quality tracks inside a secure local IndexedDB container for uploading.
                </span>
              </div>
            </div>
          </div>
        </AnalogCard>
      </div>
    </div>
  )
}
