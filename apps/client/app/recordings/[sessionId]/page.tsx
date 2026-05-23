"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Mic,
  Video,
  Monitor,
  AlertTriangle,
  RefreshCw,
  User,
  Film,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import {
  MonoLabel,
  PanelTitle,
  StatusBadge,
  NoiseBackground,
  MechButton,
} from "@/components/ui/retro-primitives";
import { useTRPC } from "@/trpc/client";

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TrackStatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <StatusBadge variant="ok">
        <LedInline color="green" size="sm" />
        UPLOADED
      </StatusBadge>
    );
  }
  if (status === "UPLOADING") {
    return (
      <StatusBadge variant="warn">
        <LedInline color="amber" size="sm" pulse />
        UPLOADING
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="recording">
      <LedInline color="red" size="sm" />
      FAILED
    </StatusBadge>
  );
}

export default function RecordingSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const trpc = useTRPC();

  const session = useQuery(
    trpc.rooms.getRecordingSessionById.queryOptions({ sessionId }, { enabled: !!sessionId }),
  );

  const transcript = useQuery(
    trpc.transcript.getSegments.queryOptions({ sessionId }, { enabled: !!sessionId }),
  );

  const chapters = useQuery(
    trpc.transcript.getChapters.queryOptions({ sessionId }, { enabled: !!sessionId }),
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (session.isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Session Tapes...
          </span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (session.error || !session.data) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
          <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
            Session Not Found
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            Recording session &ldquo;{sessionId.slice(-8).toUpperCase()}&rdquo; could not be
            located.
          </p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const data = session.data;
  const allUploaded = data.tracks.every((t) => t.status === "COMPLETED");
  const totalTracks = data.tracks.length;

  // Group tracks by participant
  const byUser = data.tracks.reduce<Record<string, typeof data.tracks>>((acc, track) => {
    const key = track.user?.name ?? track.user?.email ?? "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(track);
    return acc;
  }, {});

  return (
    <div className="bg-background text-foreground relative min-h-screen p-4 font-sans md:p-8">
      <NoiseBackground />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="border-border flex flex-col items-start justify-between gap-4 border-b-2 pb-4 md:flex-row md:items-end">
          <div className="flex items-end gap-4">
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl leading-none font-bold tracking-tight uppercase">
                Session Review
              </h1>
              <MonoLabel className="mt-1.5 block">
                REEL: {data.id.slice(-8).toUpperCase()} // {data.room.name}
              </MonoLabel>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant={allUploaded ? "ok" : "warn"}>
              <LedInline color={allUploaded ? "green" : "amber"} size="sm" pulse={!allUploaded} />
              {allUploaded ? "ALL UPLOADED" : "SYNC PENDING"}
            </StatusBadge>
          </div>
        </header>

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                label: "Session ID",
                value: data.id.slice(-8).toUpperCase(),
                accent: true,
              },
              {
                label: "Room Code",
                value: data.room.code,
                accent: false,
              },
              {
                label: "Started At",
                value: new Date(data.startedAt).toLocaleString(),
                accent: false,
              },
              {
                label: "Total Tracks",
                value: String(totalTracks),
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <AnalogInset key={label} className="flex flex-col gap-1.5 p-4">
                <MonoLabel>{label}</MonoLabel>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}
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
              <Film className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
              <MonoLabel className="mb-2 block">No Tracks Registered</MonoLabel>
              <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-xs leading-normal">
                Participants must upload their local recordings to populate this index.
              </p>
            </AnalogCard>
          ) : (
            Object.entries(byUser).map(([userName, tracks]) => {
              const userUploaded = tracks.every((t) => t.status === "COMPLETED");
              return (
                <AnalogCard key={userName} className="p-6">
                  {/* Participant header */}
                  <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-popover border-border flex h-8 w-8 items-center justify-center rounded border">
                        <User className="text-muted-foreground h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight uppercase">{userName}</p>
                        <MonoLabel>
                          {tracks.length} track{tracks.length !== 1 ? "s" : ""}
                        </MonoLabel>
                      </div>
                    </div>
                    <StatusBadge variant={userUploaded ? "ok" : "warn"}>
                      <LedInline
                        color={userUploaded ? "green" : "amber"}
                        size="sm"
                        pulse={!userUploaded}
                      />
                      {userUploaded ? "COMPLETE" : "PENDING"}
                    </StatusBadge>
                  </div>

                  {/* Track list */}
                  <div className="space-y-3">
                    {tracks.map((track) => {
                      const Icon = TRACK_TYPE_ICON[track.type] ?? Mic;
                      return (
                        <AnalogInset key={track.id} className="p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <div className="bg-card border-border flex h-8 w-8 shrink-0 items-center justify-center rounded border">
                                <Icon className="text-muted-foreground h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold tracking-tight uppercase">
                                  {track.type}
                                </p>
                                <MonoLabel className="text-[9px]">
                                  SID: {track.trackSid.slice(-12)}
                                </MonoLabel>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <TrackStatusBadge status={track.status} />

                              {track.status === "COMPLETED" && track.s3Url ? (
                                <a
                                  href={track.s3Url}
                                  download
                                  className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold tracking-wider uppercase"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </a>
                              ) : track.status === "UPLOADING" ? (
                                <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px]">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>In Progress</span>
                                </div>
                              ) : (
                                <MonoLabel className="text-led-on text-[9px]">
                                  Upload Required
                                </MonoLabel>
                              )}
                            </div>
                          </div>

                          {/* Upload progress bar for uploading tracks */}
                          {track.status === "UPLOADING" && (
                            <div className="mt-3">
                              <AnalogInset className="flex h-2 items-stretch p-0.5">
                                <div
                                  className="animate-pulse rounded-sm"
                                  style={{
                                    width: "60%",
                                    backgroundColor: "var(--accent)",
                                  }}
                                />
                              </AnalogInset>
                            </div>
                          )}
                        </AnalogInset>
                      );
                    })}
                  </div>
                </AnalogCard>
              );
            })
          )}
        </div>

        {/* ── Transcript Section ────────────────────────────────────────── */}
        {transcript.data && transcript.data.length > 0 && (
          <div className="space-y-4">
            <PanelTitle label="AI Transcript" title="Session Transcript" />

            <AnalogCard className="p-6">
              {chapters.data && chapters.data.length > 0 && (
                <div className="border-border mb-6 border-b pb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="text-accent h-4 w-4" />
                    <h3 className="text-sm font-bold tracking-wider uppercase">Chapters</h3>
                  </div>
                  <div className="space-y-1">
                    {chapters.data.map((ch) => (
                      <div
                        key={ch.id}
                        className="border-border bg-popover flex items-center gap-3 rounded border px-3 py-2"
                      >
                        <MonoLabel className="text-accent shrink-0">
                          {formatTime(ch.startTime)}
                        </MonoLabel>
                        <span className="text-foreground font-mono text-xs">{ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                {transcript.data.map((seg) => (
                  <div
                    key={seg.id}
                    className="hover:bg-popover/50 group rounded px-2 py-1.5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MonoLabel className="text-muted-foreground mt-0.5 shrink-0 text-[9px]">
                        {formatTime(seg.startTime)}
                      </MonoLabel>
                      <p className="text-foreground/90 font-mono text-[11px] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnalogCard>
          </div>
        )}

        {transcript.isLoading && (
          <AnalogCard className="flex items-center justify-center gap-3 p-12">
            <RefreshCw className="text-accent h-5 w-5 animate-spin" />
            <MonoLabel className="animate-pulse">Transcription in progress...</MonoLabel>
          </AnalogCard>
        )}

        {/* ── Session Footer Note ───────────────────────────────────────── */}
        <AnalogCard className="flex items-start gap-3 p-5">
          <Led color="green" size="sm" className="mt-0.5 shrink-0" />
          <div>
            <MonoLabel className="mb-1 block">System Note</MonoLabel>
            <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
              Tracks are uploaded directly from participants&apos; browser IndexedDB storage. If a
              participant closed their tab before upload completed, they must reopen the recording
              recovery console to resume. Download links are valid after full upload completion.
            </p>
          </div>
        </AnalogCard>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <Link
            href={`/rooms/${data.room.code}/settings`}
            className="text-muted-foreground hover:text-accent font-mono text-xs font-bold tracking-widest uppercase transition-colors"
          >
            Room Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
