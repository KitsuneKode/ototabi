"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { AnalogCard } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import {
  MonoLabel,
  PanelTitle,
  NoiseBackground,
  MechButton,
} from "@/components/ui/retro-primitives";
import { RefreshCw, CheckCircle, AlertTriangle, HardDrive, ArrowLeft, Upload } from "@/lib/icons";
import { db, type UploadSession } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";
import { recoverPendingUpload } from "@/lib/uploader/upload-recovery";
import { useTRPC } from "@/trpc/client";

interface PendingTrack extends UploadSession {
  pendingChunks: number;
}

export default function RecoveryPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [pendingTracks, setPendingTracks] = useState<PendingTrack[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [retryingTracks, setRetryingTracks] = useState<Set<string>>(new Set());
  const [completedTracks, setCompletedTracks] = useState<Set<string>>(new Set());
  const [progressByTrack, setProgressByTrack] = useState<Record<string, string>>({});
  const [opfsUsage, setOpfsUsage] = useState<{ files: number; bytes: number } | null>(null);

  const authState = useQuery(trpc.auth.getSession.queryOptions());

  // ── Auth Gate ──────────────────────────────────────────────────────────
  if (!authState.isLoading && !authState.data) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
          <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
            Authentication Required
          </p>
          <MechButton onClick={() => router.push("/auth/signin")} className="w-full justify-center">
            Sign In
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  useEffect(() => {
    async function loadLocalTracks() {
      try {
        const sessions = await db.uploadSessions.toArray();
        const tracks = await Promise.all(
          sessions.map(async (s) => {
            const chunkCount = await db.chunks
              .where("trackSid")
              .equals(s.trackSid)
              .filter((c) => c.status === "pending" || c.status === "failed")
              .count();
            return {
              trackSid: s.trackSid,
              sessionId: s.sessionId,
              s3Key: s.s3Key,
              type: s.type,
              uploadId: s.uploadId,
              pendingChunks: chunkCount,
            };
          }),
        );
        setPendingTracks(tracks);
      } catch {
        setLocalError("Failed to read local IndexedDB storage.");
      } finally {
        setIsLoadingLocal(false);
      }

      try {
        const usage = await opfsStorage.getUsage();
        setOpfsUsage(usage);
      } catch {
        // OPFS may not be available
      }
    }
    loadLocalTracks();
  }, []);

  const handleRetry = useCallback(async (track: PendingTrack) => {
    setRetryingTracks((prev) => new Set(prev).add(track.trackSid));
    try {
      await recoverPendingUpload(track, ({ uploaded, total }) => {
        setProgressByTrack((prev) => ({
          ...prev,
          [track.trackSid]: `${uploaded}/${total}`,
        }));
      });
      setCompletedTracks((prev) => new Set(prev).add(track.trackSid));
      setPendingTracks((prev) => prev.filter((candidate) => candidate.trackSid !== track.trackSid));
    } catch {
      setLocalError("Failed to recover upload. Check your connection and try again.");
    } finally {
      setRetryingTracks((prev) => {
        const next = new Set(prev);
        next.delete(track.trackSid);
        return next;
      });
    }
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoadingLocal) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Scanning Local Storage...
          </span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (localError) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
          <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
            Storage Read Failure
          </p>
          <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
            {localError}
          </p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground relative min-h-screen p-4 font-sans md:p-8">
      <NoiseBackground />

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="border-border flex items-end justify-between border-b-2 pb-4">
          <div className="flex items-end gap-4">
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
            <div>
              <h1 className="text-3xl leading-none font-bold tracking-tight uppercase">
                Recovery Console
              </h1>
              <MonoLabel className="mt-1.5 block">
                Local IndexedDB + OPFS Redundant Storage Recovery
              </MonoLabel>
            </div>
          </div>
          <Led color="amber" size="md" pulse label="PENDING" />
        </header>

        {/* ── Empty State ───────────────────────────────────────────────── */}
        {pendingTracks.length === 0 ? (
          <AnalogCard className="p-12 text-center">
            <HardDrive className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
            <PanelTitle label="Storage Status" title="No Pending Recordings" />
            <p className="text-muted-foreground/60 mx-auto mt-4 max-w-sm font-mono text-xs leading-normal">
              No pending recordings were found in your browser&apos;s local IndexedDB storage. All
              local tracks have been uploaded.
            </p>
            {opfsUsage && (
              <div className="border-border mt-6 inline-flex items-center gap-3 rounded border px-4 py-2">
                <Led color="green" size="sm" />
                <MonoLabel>
                  OPFS: {opfsUsage.files} files, {(opfsUsage.bytes / 1024 / 1024).toFixed(1)} MB
                </MonoLabel>
              </div>
            )}
            <MechButton onClick={() => router.push("/dashboard")} className="mx-auto mt-6">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </MechButton>
          </AnalogCard>
        ) : (
          /* ── Pending Tracks List ─────────────────────────────────────── */
          <div className="space-y-4">
            <PanelTitle
              label="Pending Tracks"
              title={`${pendingTracks.length} Track${pendingTracks.length !== 1 ? "s" : ""} Awaiting Upload`}
            />

            {pendingTracks.map((track) => {
              const isRetrying = retryingTracks.has(track.trackSid);
              const isCompleted = completedTracks.has(track.trackSid);

              return (
                <AnalogCard key={track.trackSid} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-popover border-border flex h-10 w-10 shrink-0 items-center justify-center rounded border">
                        <HardDrive className="text-muted-foreground h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight uppercase">{track.type}</p>
                        <MonoLabel className="text-[9px]">
                          SID: {track.trackSid.slice(-12)}
                        </MonoLabel>
                        <MonoLabel className="text-[9px]">
                          Chunks: {track.pendingChunks}
                          {" | "}Session: {track.sessionId.slice(-8).toUpperCase()}
                        </MonoLabel>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {isCompleted ? (
                        <span className="border-led-green/30 bg-led-green/10 text-led-green inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase">
                          <CheckCircle className="h-3 w-3" />
                          RETRY INITIATED
                        </span>
                      ) : (
                        <>
                          <span className="border-border bg-popover text-led-on inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase">
                            <LedInline color="red" size="sm" />
                            {track.pendingChunks} PENDING
                          </span>
                          <MechButton
                            onClick={() => handleRetry(track)}
                            disabled={isRetrying}
                            className="h-8 px-3 py-1.5 text-[10px]"
                          >
                            {isRetrying ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                {progressByTrack[track.trackSid] ?? "RETRYING"}
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
              );
            })}

            {/* ── System Note ──────────────────────────────────────────── */}
            <AnalogCard className="flex items-start gap-3 p-5">
              <Led color="amber" size="sm" pulse className="mt-0.5 shrink-0" />
              <div>
                <MonoLabel className="mb-1 block">System Note</MonoLabel>
                <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
                  Tracks stored in IndexedDB with pending or failed chunks can be retried from this
                  console. After retry, the upload process will resume from where it left off. If
                  the track was already completed on the server, no further action is needed.
                </p>
              </div>
            </AnalogCard>
          </div>
        )}
      </div>
    </div>
  );
}
