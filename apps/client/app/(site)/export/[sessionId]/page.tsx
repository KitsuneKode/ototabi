"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useRef, useCallback } from "react";

import type { BackgroundBlurPreset } from "@/lib/demo/demo-background-presets";

import { ClipRenderActions } from "@/components/clips/clip-render-actions";
import { SessionExportActions } from "@/components/clips/session-export-actions";
import { TranscriptEditor } from "@/components/editor/transcript-editor";
import { ExportBundlePicker } from "@/components/export/export-bundle-picker";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { AnalogLoadingPanel, AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { SessionTimeline } from "@/components/patterns/session-timeline";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDateTime, formatTimestamp } from "@/lib/date-utils";
import { isValidBlurPreset } from "@/lib/demo/demo-background-presets";
import {
  buildDemoFfmpegExecArgs,
  removeDemoExportInputs,
  resolveDemoExportTracks,
  writeDemoInputsToFfmpeg,
} from "@/lib/demo/demo-export-pipeline";
import { DEMO_ASPECT_LABELS, type DemoAspectPreset } from "@/lib/demo/demo-export-presets";
import { useExportConsole } from "@/lib/hooks/use-export-console";
import { useAuthGate } from "@/lib/hooks/use-session";
import { useSessionReview } from "@/lib/hooks/use-session-review";
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
} from "@/lib/icons";
import { getSyncConfidenceWarning, getSyncMarkerOffsetMs } from "@/lib/merge-session-timeline";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useTRPC } from "@/trpc/client";
import { trpcClient } from "@/trpc/vanilla";

const TRACK_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  MICROPHONE: Mic,
  CAMERA: Video,
  SCREENSHARE: Monitor,
};

async function downloadFile(ffmpeg: FFmpeg, filename: string, downloadName: string) {
  const fileData = await ffmpeg.readFile(filename);
  const blob = new Blob([fileData as unknown as BlobPart], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  a.click();
  URL.revokeObjectURL(url);
  await ffmpeg.deleteFile(filename);
}

type TrackWithMedia = { s3Url?: string | null; s3Key?: string | null };

/** Download tracks in parallel, then write inputs for ffmpeg concat. */
async function writeTracksToFfmpeg(ffmpeg: FFmpeg, tracks: TrackWithMedia[]): Promise<string> {
  const prepared = await Promise.all(
    tracks.map(async (track, i) => {
      const name = `input_${i}.mp4`;
      const mediaRef = track.s3Url ?? track.s3Key;
      if (!mediaRef) throw new Error(`Track ${i + 1} has no media reference`);
      const downloadUrl = await resolveTrackDownloadUrl(trpcClient, mediaRef);
      if (!downloadUrl) throw new Error(`Could not resolve download URL for track ${i + 1}`);
      const data = await fetchFile(downloadUrl);
      return { name, data };
    }),
  );
  await Promise.all(prepared.map(({ name, data }) => ffmpeg.writeFile(name, data)));
  return prepared.map(({ name }) => `file '${name}'\n`).join("");
}

async function removeTrackInputs(ffmpeg: FFmpeg, trackCount: number): Promise<void> {
  await Promise.all([
    ...Array.from({ length: trackCount }, (_, i) => ffmpeg.deleteFile(`input_${i}.mp4`)),
    ffmpeg.deleteFile("concat_list.txt"),
  ]);
}

function TrackDownloadButton({ mediaRef }: { mediaRef: string }) {
  const handleDownload = async () => {
    const url = await resolveTrackDownloadUrl(trpcClient, mediaRef);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <MechButton
      type="button"
      onClick={() => void handleDownload()}
      className="text-secondary-foreground inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
    >
      <Download className="h-3.5 w-3.5" />
      Download
    </MechButton>
  );
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

export default function ExportSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const trpc = useTRPC();
  const { sessionReady } = useAuthGate();

  const usage = useQuery({
    ...trpc.usage.get.queryOptions(),
    enabled: sessionReady,
  });
  const canTextEdit = usage.data?.features.textBasedEditing ?? false;

  const checkout = useMutation(
    trpc.billing.checkout.mutationOptions({
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    }),
  );

  const startProCheckout = useCallback(() => {
    const successUrl = `${window.location.origin}/export/${sessionId}?billing=success`;
    checkout.mutate({ plan: "pro", successUrl });
  }, [checkout, sessionId]);

  const {
    query,
    session,
    transcriptSegments,
    clipCandidates,
    exports,
    syncMarkers,
    timelineEvents,
    allUploaded,
    aggregateUploadStatus,
    isBootingAuth,
  } = useSessionReview(sessionId);

  const demoSessionQuery = useQuery({
    ...trpc.demo.getSession.queryOptions({ sessionId }),
    enabled: sessionReady && Boolean(sessionId) && session?.mode === "DEMO",
  });

  const syncOffsetMs = getSyncMarkerOffsetMs(syncMarkers);
  const completedTrackCount =
    session?.tracks.filter((t) => t.status === "COMPLETED" && (t.s3Url || t.s3Key)).length ?? 0;
  const syncConfidenceWarning = getSyncConfidenceWarning({
    syncMarkerCount: syncMarkers?.length ?? 0,
    completedTrackCount,
  });

  const {
    ffmpegLoaded,
    processingStatus,
    processingMode,
    progress,
    selectedTrackIds,
    cutSegmentIds,
    trimStart,
    trimEnd,
    trimTrackId,
    errorMessage,
    noiseReduction,
    setFfmpegLoaded,
    beginProcessing,
    setProcessingStatus,
    setProgress,
    setErrorMessage,
    setNoiseReduction,
    setTrimStart,
    setTrimEnd,
    setTrimTrackId,
    toggleTrack,
    toggleCutSegment,
    clearCutSegments,
    previewCutRange,
    setPreviewCutRange,
  } = useExportConsole(sessionId);

  const ffmpegRef = useRef(new FFmpeg());

  const loadFfmpeg = useCallback(async () => {
    if (ffmpegLoaded) return;
    setProcessingStatus("loading-ffmpeg");
    setErrorMessage("");
    try {
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm";
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
        setProgress(Math.round(p * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      });

      setFfmpegLoaded(true);
      setProcessingStatus("idle");
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to load FFmpeg");
    }
  }, [ffmpegLoaded, setErrorMessage, setFfmpegLoaded, setProcessingStatus, setProgress]);

  const handleMerge = useCallback(async () => {
    if (!session) return;
    const tracks = session.tracks.filter(
      (t) => selectedTrackIds.includes(t.id) && t.status === "COMPLETED" && (t.s3Url || t.s3Key),
    );
    if (tracks.length < 2) return;

    beginProcessing("merge");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;

      const content = await writeTracksToFfmpeg(ffmpeg, tracks);

      await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
      const audioFilters: string[] = [];
      if (noiseReduction) audioFilters.push("afftdn");
      if (syncOffsetMs > 0) audioFilters.push(`adelay=${syncOffsetMs}|${syncOffsetMs}`);
      const mergeArgs = [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat_list.txt",
        ...(audioFilters.length > 0 ? ["-af", audioFilters.join(",")] : []),
        "-c:v",
        "copy",
        ...(audioFilters.length > 0 ? ["-c:a", "aac"] : ["-c:a", "copy"]),
        "output.mp4",
      ];
      await ffmpeg.exec(mergeArgs);

      await downloadFile(ffmpeg, "output.mp4", `session-${sessionId.slice(-8)}-merged.mp4`);

      await removeTrackInputs(ffmpeg, tracks.length);

      setProcessingStatus("done");
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Merge failed");
    }
  }, [
    session,
    selectedTrackIds,
    beginProcessing,
    loadFfmpeg,
    sessionId,
    noiseReduction,
    syncOffsetMs,
    setErrorMessage,
    setProcessingStatus,
  ]);

  const handleExportRes = useCallback(
    async (resolution: "720p" | "1080p") => {
      if (!session) return;
      const tracks = session.tracks.filter(
        (t) => selectedTrackIds.includes(t.id) && t.status === "COMPLETED" && (t.s3Url || t.s3Key),
      );
      if (tracks.length === 0) return;

      const mode = resolution === "720p" ? "720p" : "1080p";
      beginProcessing(mode);

      try {
        await loadFfmpeg();
        const ffmpeg = ffmpegRef.current;

        const scale = resolution === "720p" ? "1280:720" : "1920:1080";
        const content = await writeTracksToFfmpeg(ffmpeg, tracks);

        await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
        const audioFilters: string[] = [];
        if (noiseReduction) audioFilters.push("afftdn");
        if (syncOffsetMs > 0) audioFilters.push(`adelay=${syncOffsetMs}|${syncOffsetMs}`);
        const exportArgs = [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "concat_list.txt",
          ...(audioFilters.length > 0 ? ["-af", audioFilters.join(",")] : []),
          "-vf",
          `scale=${scale}`,
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "output.mp4",
        ];
        await ffmpeg.exec(exportArgs);

        await downloadFile(
          ffmpeg,
          "output.mp4",
          `session-${sessionId.slice(-8)}-${resolution}.mp4`,
        );

        await removeTrackInputs(ffmpeg, tracks.length);

        setProcessingStatus("done");
      } catch (err) {
        setProcessingStatus("error");
        setErrorMessage(err instanceof Error ? err.message : `${resolution} export failed`);
      }
    },
    [
      session,
      selectedTrackIds,
      beginProcessing,
      loadFfmpeg,
      sessionId,
      noiseReduction,
      syncOffsetMs,
      setErrorMessage,
      setProcessingStatus,
    ],
  );

  const handleDemoAspectExport = useCallback(
    async (preset: DemoAspectPreset) => {
      if (!session) return;
      const resolved = resolveDemoExportTracks(session.tracks, selectedTrackIds);
      if (!resolved.display) return;

      const demoEdit = demoSessionQuery.data?.demo;
      const blurLevel = demoEdit?.backgroundBlur ?? 0;
      const edit = {
        trimStartMs: demoEdit?.trimStartMs ?? null,
        trimEndMs: demoEdit?.trimEndMs ?? null,
        playbackSpeed: demoEdit?.playbackSpeed ?? 1,
        backgroundBlur: (isValidBlurPreset(blurLevel) ? blurLevel : 0) as BackgroundBlurPreset,
        pipEnabled: demoEdit?.pipEnabled ?? true,
      };

      beginProcessing(preset);

      try {
        await loadFfmpeg();
        const ffmpeg = ffmpegRef.current;
        const inputs = await writeDemoInputsToFfmpeg(ffmpeg, {
          display: resolved.display,
          camera: resolved.camera,
          mic: resolved.mic,
        });
        const exportArgs = buildDemoFfmpegExecArgs({
          inputs,
          aspectPreset: preset,
          edit,
          noiseReduction,
        });
        await ffmpeg.exec(exportArgs);

        await downloadFile(
          ffmpeg,
          "output.mp4",
          `demo-${sessionId.slice(-8)}-${preset.replace(":", "x")}.mp4`,
        );

        await removeDemoExportInputs(ffmpeg, inputs);

        setProcessingStatus("done");
      } catch (err) {
        setProcessingStatus("error");
        setErrorMessage(err instanceof Error ? err.message : `${preset} export failed`);
      }
    },
    [
      session,
      selectedTrackIds,
      demoSessionQuery.data?.demo,
      beginProcessing,
      loadFfmpeg,
      sessionId,
      noiseReduction,
      setErrorMessage,
      setProcessingStatus,
    ],
  );

  const handleTrim = useCallback(async () => {
    if (!trimTrackId || (!trimStart && !trimEnd)) return;

    beginProcessing("trim");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;

      const track = session?.tracks.find((t) => t.id === trimTrackId);
      const mediaRef = track?.s3Url ?? track?.s3Key;
      if (!mediaRef) throw new Error("Track not found");

      const downloadUrl = await resolveTrackDownloadUrl(trpcClient, mediaRef);
      if (!downloadUrl) throw new Error("Could not resolve track download URL");

      const data = await fetchFile(downloadUrl);
      await ffmpeg.writeFile("input.mp4", data);

      const args = ["-i", "input.mp4"];
      if (trimStart) args.push("-ss", String(Number(trimStart)));
      if (trimEnd) {
        const duration = trimEnd;
        args.push("-to", duration);
      }
      if (noiseReduction) {
        args.push("-af", "afftdn", "-c:v", "copy", "-c:a", "aac");
      } else {
        args.push("-c", "copy");
      }
      args.push("output.mp4");

      await ffmpeg.exec(args);

      await downloadFile(ffmpeg, "output.mp4", `session-${sessionId.slice(-8)}-trim.mp4`);

      await ffmpeg.deleteFile("input.mp4");

      setProcessingStatus("done");
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Trim failed");
    }
  }, [
    trimTrackId,
    trimStart,
    trimEnd,
    session,
    beginProcessing,
    loadFfmpeg,
    sessionId,
    noiseReduction,
    setErrorMessage,
    setProcessingStatus,
  ]);

  const handleCuts = useCallback(async () => {
    if (!session || cutSegmentIds.length === 0) return;
    const segments = transcriptSegments?.filter((s) => cutSegmentIds.includes(s.id));
    if (!segments?.length) return;

    const completed = session.tracks.filter(
      (t) => t.status === "COMPLETED" && (t.s3Url || t.s3Key),
    );
    const targetTracks =
      selectedTrackIds.length > 0
        ? completed.filter((t) => selectedTrackIds.includes(t.id))
        : completed;
    if (targetTracks.length === 0) throw new Error("No completed tracks to cut");

    beginProcessing("cuts");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;
      const allSegments = transcriptSegments ?? [];
      const sortedCuts = [...segments].toSorted((a, b) => a.startTime - b.startTime);

      const keepRanges: Array<{ start: number; end: number }> = [];
      let currentStart = 0;
      for (const cut of sortedCuts) {
        if (cut.startTime > currentStart) {
          keepRanges.push({ start: currentStart, end: cut.startTime - 0.1 });
        }
        currentStart = cut.endTime + 0.1;
      }
      const totalDuration = allSegments[allSegments.length - 1]?.endTime ?? 9999;
      if (currentStart < totalDuration) {
        keepRanges.push({ start: currentStart, end: totalDuration });
      }
      if (keepRanges.length === 0) throw new Error("Cannot cut entire video");

      for (let trackIndex = 0; trackIndex < targetTracks.length; trackIndex++) {
        const track = targetTracks[trackIndex]!;
        const mediaRef = track.s3Url ?? track.s3Key;
        if (!mediaRef) continue;

        const downloadUrl = await resolveTrackDownloadUrl(trpcClient, mediaRef);
        if (!downloadUrl)
          throw new Error(`Could not resolve download URL for track ${trackIndex + 1}`);

        const data = await fetchFile(downloadUrl);
        await ffmpeg.writeFile("input.mp4", data);

        const keepNames = await keepRanges.reduce<Promise<string[]>>(async (namesPromise, r, i) => {
          const names = await namesPromise;
          const name = `keep_${i}.mp4`;
          await ffmpeg.exec([
            "-i",
            "input.mp4",
            "-ss",
            String(r.start),
            "-to",
            String(r.end),
            "-c",
            "copy",
            name,
          ]);
          return [...names, name];
        }, Promise.resolve([]));

        const concatContent = keepNames.map((name) => `file '${name}'\n`).join("");
        await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(concatContent));
        await ffmpeg.exec([
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "concat_list.txt",
          "-c",
          "copy",
          "output.mp4",
        ]);

        const suffix = targetTracks.length > 1 ? `-${track.trackSid.slice(-6)}` : "";
        await downloadFile(
          ffmpeg,
          "output.mp4",
          `session-${sessionId.slice(-8)}-edited${suffix}.mp4`,
        );

        await Promise.all([
          ffmpeg.deleteFile("input.mp4"),
          ...keepNames.map((name) => ffmpeg.deleteFile(name)),
          ffmpeg.deleteFile("concat_list.txt"),
        ]);
      }

      setProcessingStatus("done");
      clearCutSegments();
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Cut edit failed");
    }
  }, [
    session,
    cutSegmentIds,
    transcriptSegments,
    selectedTrackIds,
    beginProcessing,
    loadFfmpeg,
    sessionId,
    clearCutSegments,
    setErrorMessage,
    setProcessingStatus,
  ]);

  const procColor =
    processingStatus === "processing" || processingStatus === "loading-ffmpeg"
      ? ("amber" as const)
      : processingStatus === "done"
        ? ("green" as const)
        : processingStatus === "error"
          ? ("red" as const)
          : ("green-off" as const);

  const procLabel =
    processingStatus === "loading-ffmpeg"
      ? "LOADING FFMPEG"
      : processingStatus === "processing"
        ? `${processingMode?.toUpperCase()} ${progress}%`
        : processingStatus === "done"
          ? "COMPLETE"
          : processingStatus === "error"
            ? "ERROR"
            : "STANDBY";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isBootingAuth || query.isLoading) {
    return (
      <AppShell maxWidth="max-w-5xl">
        <AnalogLoadingPanel label="Initializing export console..." />
      </AppShell>
    );
  }

  if (query.error || !session) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogStatePanel
          title="Session not found"
          message={`Export session "${sessionId.slice(-8).toUpperCase()}" could not be located.`}
          actionLabel="Return to dashboard"
          onAction={() => router.push("/dashboard")}
          icon={<AlertTriangle className="text-led-on h-12 w-12" />}
        />
      </div>
    );
  }

  const data = session;
  const completedTracks = data.tracks.filter((t) => t.status === "COMPLETED");

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label={`SESSION: ${data.id.slice(-8).toUpperCase()} // ${data.room.name}`}
          title="Export Console"
          actions={
            <>
              <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
                <ArrowLeft className="h-4 w-4" />
              </MechButton>
              <div className="flex items-center gap-3">
                <Led
                  color={procColor}
                  size="sm"
                  pulse={processingStatus === "processing" || processingStatus === "loading-ffmpeg"}
                />
                <StatusBadge
                  variant={
                    processingStatus === "processing" || processingStatus === "loading-ffmpeg"
                      ? "warn"
                      : processingStatus === "done"
                        ? "ok"
                        : processingStatus === "error"
                          ? "recording"
                          : "default"
                  }
                >
                  {procLabel}
                </StatusBadge>
              </div>
            </>
          }
        />

        <SessionStatusRail uploadStatus={aggregateUploadStatus} syncOk={allUploaded} />

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Session ID", value: data.id.slice(-8).toUpperCase(), accent: true },
              { label: "Room Code", value: data.room.code, accent: false },
              {
                label: "Started At",
                value: formatDateTime(data.startedAt),
                accent: false,
              },
              { label: "Total Tracks", value: String(data.tracks.length), accent: true },
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

        {/* ── Tracks Section ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <PanelTitle label="Source Tapes" title="Select Tracks" />

          {data.tracks.length === 0 ? (
            <AnalogCard className="p-12 text-center">
              <Combine className="text-muted-foreground/20 mx-auto mb-4 h-12 w-12" />
              <MonoLabel className="mb-2 block">No Tracks Available</MonoLabel>
              <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-xs leading-normal">
                This session has no recorded tracks to export.
              </p>
            </AnalogCard>
          ) : (
            <div className="space-y-2">
              {data.tracks.map((track) => {
                const Icon = TRACK_TYPE_ICON[track.type] ?? Mic;
                const isCompleted = track.status === "COMPLETED" && !!(track.s3Url || track.s3Key);
                const checked = selectedTrackIds.includes(track.id);

                return (
                  <AnalogInset key={track.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!isCompleted}
                            onChange={() => toggleTrack(track.id)}
                            className="accent-accent h-4 w-4"
                          />
                          <div className="bg-card border-border flex h-8 w-8 shrink-0 items-center justify-center rounded border">
                            <Icon className="text-muted-foreground h-4 w-4" />
                          </div>
                        </label>
                        <div>
                          <p className="text-sm font-bold tracking-tight uppercase">{track.type}</p>
                          <MonoLabel className="text-[9px]">
                            {track.user?.name ?? "Unknown"}
                          </MonoLabel>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TrackStatusBadge status={track.status} />

                        {isCompleted ? (
                          <TrackDownloadButton mediaRef={track.s3Url ?? track.s3Key} />
                        ) : track.status === "UPLOADING" ? (
                          <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px]">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>In Progress</span>
                          </div>
                        ) : (
                          <MonoLabel className="text-led-on text-[9px]">Upload Required</MonoLabel>
                        )}
                      </div>
                    </div>
                  </AnalogInset>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <PanelTitle label="Distribution" title="Export bundle" />
          <ExportBundlePicker sessionId={sessionId} />
        </div>

        {exports ? (
          <div className="space-y-4">
            <PanelTitle label="Cloud worker" title="Full-session exports" />
            <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel>Episode MP3</MonoLabel>
              <SessionExportActions
                sessionId={sessionId}
                preset="episode_mp3"
                label="episode MP3"
                downloadLabel="Download MP3"
                exportSlot={exports.episodeMp3}
                onQueued={() => void query.refetch()}
              />
            </AnalogInset>
            <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel>Landscape 16:9</MonoLabel>
              <SessionExportActions
                sessionId={sessionId}
                preset="landscape_16_9"
                label="landscape"
                downloadLabel="Download 16:9"
                exportSlot={exports.landscape}
                onQueued={() => void query.refetch()}
              />
            </AnalogInset>
          </div>
        ) : null}

        {clipCandidates && clipCandidates.length > 0 ? (
          <div className="space-y-4">
            <PanelTitle label="Cloud worker" title="9:16 clip renders" />
            <div className="space-y-3">
              {clipCandidates.map((clip) => (
                <AnalogInset key={clip.id} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <MonoLabel>
                      {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)} &bull;
                      score {(clip.score * 100).toFixed(0)}%
                    </MonoLabel>
                    <ClipRenderActions
                      sessionId={sessionId}
                      clipId={clip.id}
                      renderStatus={clip.renderStatus}
                      renderS3Key={clip.renderS3Key}
                      renderError={clip.renderError}
                      onQueued={() => void query.refetch()}
                    />
                  </div>
                </AnalogInset>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Text-Based Editing (Pro+) ─────────────────────────────────── */}
        {transcriptSegments && transcriptSegments.length > 0 && completedTracks.length > 0 ? (
          <div className="space-y-4">
            <PanelTitle label="Pro feature" title="Text-based editing" />
            {!canTextEdit ? (
              <AnalogInset className="space-y-3 p-4">
                <p className="text-muted-foreground font-mono text-[11px] leading-relaxed">
                  Cut and remove segments from the transcript requires a Pro plan or higher.
                  {usage.data?.effectivePlan === "TRIAL"
                    ? " Trial includes one lifetime transcript; unlimited editing is on Pro."
                    : null}
                </p>
                <MechButton
                  type="button"
                  onClick={startProCheckout}
                  disabled={checkout.isPending}
                  className="w-full justify-center sm:w-auto"
                >
                  Upgrade to Pro
                </MechButton>
              </AnalogInset>
            ) : null}
            <div
              className={
                canTextEdit ? "space-y-4" : "pointer-events-none space-y-4 opacity-50 select-none"
              }
            >
              <TranscriptEditor
                segments={transcriptSegments}
                cutSegmentIds={cutSegmentIds}
                onToggleCutSegment={toggleCutSegment}
                previewRange={previewCutRange}
                onPreviewRange={(startTime, endTime) => setPreviewCutRange({ startTime, endTime })}
              />
              {previewCutRange ? (
                <AnalogInset className="p-3">
                  <MonoLabel className="text-[9px]">
                    Preview range {formatTimestamp(previewCutRange.startTime)} –{" "}
                    {formatTimestamp(previewCutRange.endTime)} (click segment to change)
                  </MonoLabel>
                </AnalogInset>
              ) : null}
              <MechButton
                onClick={handleCuts}
                disabled={
                  !canTextEdit ||
                  cutSegmentIds.length === 0 ||
                  processingStatus === "processing" ||
                  processingStatus === "loading-ffmpeg"
                }
                className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Scissors className="h-3.5 w-3.5" />
                Remove {cutSegmentIds.length} Selected Segment
                {cutSegmentIds.length !== 1 ? "s" : ""}
                {selectedTrackIds.length > 0
                  ? ` (${selectedTrackIds.length} track${selectedTrackIds.length !== 1 ? "s" : ""})`
                  : " (all completed tracks)"}
              </MechButton>
            </div>

            {errorMessage && processingMode === "cuts" ? (
              <div className="border-led-on/30 bg-led-on/5 flex items-start gap-2 rounded border p-3">
                <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <PanelTitle label="Sync Tape" title="Session Timeline" />
          {syncOffsetMs > 0 ? (
            <MonoLabel className="text-accent block text-[10px]">
              Sync baseline: {syncOffsetMs}ms — applied to merge/export audio when processing
            </MonoLabel>
          ) : null}
          {syncConfidenceWarning ? (
            <div className="border-led-on/30 bg-led-on/5 flex items-start gap-2 rounded border p-3">
              <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-led-on font-mono text-[10px] leading-relaxed">
                {syncConfidenceWarning}
              </p>
            </div>
          ) : null}
          <SessionTimeline events={timelineEvents} isLoading={query.isFetching && !query.data} />
        </div>

        {/* ── Merge / Export Section ────────────────────────────────────── */}
        {completedTracks.length > 0 && (
          <AnalogCard className="p-6">
            <PanelTitle label="Mastering Suite" title="Merge & Export" className="mb-5" />

            {errorMessage && !processingMode && (
              <div className="border-led-on/30 bg-led-on/5 mb-4 flex items-start gap-2 rounded border p-3">
                <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="border-border bg-popover hover:border-accent/30 flex cursor-pointer items-center gap-3 rounded border px-4 py-2.5 transition-colors">
                <input
                  type="checkbox"
                  checked={noiseReduction}
                  onChange={(e) => setNoiseReduction(e.target.checked)}
                  className="accent-accent h-4 w-4"
                />
                <div>
                  <MonoLabel className="text-foreground block">Noise Reduction</MonoLabel>
                  <MonoLabel className="text-muted-foreground/60 text-[9px]">
                    Apply afftdn filter for cleaner audio
                  </MonoLabel>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MechButton
                onClick={handleMerge}
                disabled={
                  selectedTrackIds.length < 2 ||
                  processingStatus === "processing" ||
                  processingStatus === "loading-ffmpeg"
                }
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Combine className="h-3.5 w-3.5" />
                Merge Selected Tracks
              </MechButton>

              <MechButton
                onClick={() => handleExportRes("720p")}
                disabled={
                  selectedTrackIds.length === 0 ||
                  processingStatus === "processing" ||
                  processingStatus === "loading-ffmpeg"
                }
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export 720p
              </MechButton>

              <MechButton
                onClick={() => handleExportRes("1080p")}
                disabled={
                  selectedTrackIds.length === 0 ||
                  processingStatus === "processing" ||
                  processingStatus === "loading-ffmpeg"
                }
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export 1080p
              </MechButton>

              {session.mode === "DEMO" ? (
                <>
                  <MechButton
                    onClick={() => handleDemoAspectExport("16:9")}
                    disabled={
                      selectedTrackIds.length === 0 ||
                      processingStatus === "processing" ||
                      processingStatus === "loading-ffmpeg"
                    }
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {DEMO_ASPECT_LABELS["16:9"]}
                  </MechButton>
                  <MechButton
                    onClick={() => handleDemoAspectExport("9:16")}
                    disabled={
                      selectedTrackIds.length === 0 ||
                      processingStatus === "processing" ||
                      processingStatus === "loading-ffmpeg"
                    }
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {DEMO_ASPECT_LABELS["9:16"]}
                  </MechButton>
                </>
              ) : null}
            </div>

            {/* Progress bar */}
            {(processingStatus === "processing" || processingStatus === "loading-ffmpeg") && (
              <div className="mt-5">
                <AnalogInset className="flex h-2 items-stretch p-0.5">
                  <div
                    className="rounded-sm transition-all duration-300"
                    style={{
                      width: `${processingStatus === "loading-ffmpeg" ? 30 : progress}%`,
                      backgroundColor: "var(--accent)",
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

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-track" className="mb-1.5 block">
                  Select Track
                </MonoLabel>
                <select
                  id="trim-track"
                  value={trimTrackId ?? ""}
                  onChange={(e) => setTrimTrackId(e.target.value || null)}
                  className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs uppercase focus:outline-none"
                >
                  <option value="">— Select —</option>
                  {completedTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type} — {t.user?.name ?? "Unknown"}
                    </option>
                  ))}
                </select>
              </AnalogInset>

              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-start" className="mb-1.5 block">
                  Skip Start (s)
                </MonoLabel>
                <input
                  id="trim-start"
                  type="number"
                  min="0"
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  placeholder="0"
                  className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none"
                />
              </AnalogInset>

              <AnalogInset className="p-3">
                <MonoLabel as="label" htmlFor="trim-end" className="mb-1.5 block">
                  End Time (s)
                </MonoLabel>
                <input
                  id="trim-end"
                  type="number"
                  min="0"
                  step="0.5"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  placeholder="0"
                  className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none"
                />
              </AnalogInset>
            </div>

            <MechButton
              onClick={handleTrim}
              disabled={
                !trimTrackId ||
                (!trimStart && !trimEnd) ||
                processingStatus === "processing" ||
                processingStatus === "loading-ffmpeg"
              }
              className="mt-4 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Scissors className="h-3.5 w-3.5" />
              Apply Trim
            </MechButton>

            {errorMessage && processingMode === "trim" && (
              <div className="border-led-on/30 bg-led-on/5 mt-4 flex items-start gap-2 rounded border p-3">
                <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </AnalogCard>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <MechButton onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </MechButton>
          <MechButton onClick={() => router.push(`/recordings/${sessionId}`)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Session Review
          </MechButton>
        </div>
      </div>
    </AppShell>
  );
}
