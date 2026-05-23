"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

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

type ProcessingStatus = "idle" | "loading-ffmpeg" | "processing" | "done" | "error";
type ProcessingMode = "merge" | "trim" | "720p" | "1080p" | "cuts" | null;

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

  const ffmpegRef = useRef(new FFmpeg());
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>(null);
  const [progress, setProgress] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [trimStart, setTrimStart] = useState("");
  const [trimEnd, setTrimEnd] = useState("");
  const [trimTrackId, setTrimTrackId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [cutSegments, setCutSegments] = useState<Set<string>>(new Set());

  const session = useQuery(
    trpc.rooms.getRecordingSessionById.queryOptions({ sessionId }, { enabled: !!sessionId }),
  );

  const transcript = useQuery(
    trpc.transcript.getSegments.queryOptions({ sessionId }, { enabled: !!sessionId }),
  );

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
  }, [ffmpegLoaded]);

  const toggleTrack = useCallback((trackId: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const toggleCutSegment = useCallback((segId: string) => {
    setCutSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segId)) next.delete(segId);
      else next.add(segId);
      return next;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (!session.data) return;
    const tracks = session.data.tracks.filter(
      (t) => selectedTracks.has(t.id) && t.status === "COMPLETED" && t.s3Url,
    );
    if (tracks.length < 2) return;

    setProcessingMode("merge");
    setProcessingStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;

      let content = "";
      for (let i = 0; i < tracks.length; i++) {
        const name = `input_${i}.mp4`;
        const data = await fetchFile(tracks[i]!.s3Url!);
        await ffmpeg.writeFile(name, data);
        content += `file '${name}'\n`;
      }

      await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
      const mergeArgs = [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat_list.txt",
        ...(noiseReduction ? ["-af", "afftdn"] : []),
        "-c:v",
        "copy",
        ...(noiseReduction ? ["-c:a", "aac"] : ["-c:a", "copy"]),
        "output.mp4",
      ];
      await ffmpeg.exec(mergeArgs);

      await downloadFile(ffmpeg, "output.mp4", `session-${sessionId.slice(-8)}-merged.mp4`);

      for (let i = 0; i < tracks.length; i++) {
        await ffmpeg.deleteFile(`input_${i}.mp4`);
      }
      await ffmpeg.deleteFile("concat_list.txt");

      setProcessingStatus("done");
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Merge failed");
    }
  }, [session.data, selectedTracks, loadFfmpeg, sessionId, noiseReduction]);

  const handleExportRes = useCallback(
    async (resolution: "720p" | "1080p") => {
      if (!session.data) return;
      const tracks = session.data.tracks.filter(
        (t) => selectedTracks.has(t.id) && t.status === "COMPLETED" && t.s3Url,
      );
      if (tracks.length === 0) return;

      const mode = resolution === "720p" ? "720p" : "1080p";
      setProcessingMode(mode);
      setProcessingStatus("processing");
      setProgress(0);
      setErrorMessage("");

      try {
        await loadFfmpeg();
        const ffmpeg = ffmpegRef.current;

        let content = "";
        const scale = resolution === "720p" ? "1280:720" : "1920:1080";

        for (let i = 0; i < tracks.length; i++) {
          const name = `input_${i}.mp4`;
          const data = await fetchFile(tracks[i]!.s3Url!);
          await ffmpeg.writeFile(name, data);
          content += `file '${name}'\n`;
        }

        await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
        const exportArgs = [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "concat_list.txt",
          ...(noiseReduction ? ["-af", "afftdn"] : []),
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

        for (let i = 0; i < tracks.length; i++) {
          await ffmpeg.deleteFile(`input_${i}.mp4`);
        }
        await ffmpeg.deleteFile("concat_list.txt");

        setProcessingStatus("done");
      } catch (err) {
        setProcessingStatus("error");
        setErrorMessage(err instanceof Error ? err.message : `${resolution} export failed`);
      }
    },
    [session.data, selectedTracks, loadFfmpeg, sessionId, noiseReduction],
  );

  const handleTrim = useCallback(async () => {
    if (!trimTrackId || (!trimStart && !trimEnd)) return;

    setProcessingMode("trim");
    setProcessingStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;

      const track = session.data?.tracks.find((t) => t.id === trimTrackId);
      if (!track?.s3Url) throw new Error("Track not found");

      const data = await fetchFile(track.s3Url);
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
  }, [trimTrackId, trimStart, trimEnd, session.data, loadFfmpeg, sessionId, noiseReduction]);

  const handleCuts = useCallback(async () => {
    if (!session.data || cutSegments.size === 0) return;
    const segments = transcript.data?.filter((s) => cutSegments.has(s.id));
    if (!segments?.length) return;

    setProcessingMode("cuts");
    setProcessingStatus("processing");
    setProgress(0);
    setErrorMessage("");

    try {
      await loadFfmpeg();
      const ffmpeg = ffmpegRef.current;

      // Get first completed track as source
      const track = session.data.tracks.find((t) => t.status === "COMPLETED" && t.s3Url);
      if (!track?.s3Url) throw new Error("No completed track to cut from");

      const data = await fetchFile(track.s3Url);
      await ffmpeg.writeFile("input.mp4", data);

      // Build filter: trim to keep everything EXCEPT cut segments
      const allSegments = transcript.data ?? [];
      // Sort cut segments by start time
      const sortedCuts = segments.sort((a, b) => a.startTime - b.startTime);

      // Build keep ranges (segments between cut segments)
      const keepRanges: Array<{ start: number; end: number }> = [];
      let currentStart = 0;
      for (const cut of sortedCuts) {
        if (cut.startTime > currentStart) {
          keepRanges.push({ start: currentStart, end: cut.startTime - 0.1 });
        }
        currentStart = cut.endTime + 0.1;
      }
      // Add final range
      const totalDuration = allSegments[allSegments.length - 1]?.endTime ?? 9999;
      if (currentStart < totalDuration) {
        keepRanges.push({ start: currentStart, end: totalDuration });
      }

      if (keepRanges.length === 0) throw new Error("Cannot cut entire video");

      // Trim to each keep range using concat
      let concatContent = "";
      for (let i = 0; i < keepRanges.length; i++) {
        const r = keepRanges[i]!;
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
        concatContent += `file '${name}'\n`;
      }

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

      await downloadFile(ffmpeg, "output.mp4", `session-${sessionId.slice(-8)}-edited.mp4`);

      await ffmpeg.deleteFile("input.mp4");
      for (let i = 0; i < keepRanges.length; i++) {
        await ffmpeg.deleteFile(`keep_${i}.mp4`);
      }
      await ffmpeg.deleteFile("concat_list.txt");

      setProcessingStatus("done");
      setCutSegments(new Set());
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Cut edit failed");
    }
  }, [session.data, cutSegments, transcript.data, loadFfmpeg, sessionId]);

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
  if (session.isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Initializing Export Console...
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
            Export session &ldquo;{sessionId.slice(-8).toUpperCase()}&rdquo; could not be located.
          </p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Return to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const data = session.data;
  const completedTracks = data.tracks.filter((t) => t.status === "COMPLETED");

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
                Export Console
              </h1>
              <MonoLabel className="mt-1.5 block">
                SESSION: {data.id.slice(-8).toUpperCase()} // {data.room.name}
              </MonoLabel>
            </div>
          </div>

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
        </header>

        {/* ── Session Meta Card ─────────────────────────────────────────── */}
        <AnalogCard className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Session ID", value: data.id.slice(-8).toUpperCase(), accent: true },
              { label: "Room Code", value: data.room.code, accent: false },
              {
                label: "Started At",
                value: new Date(data.startedAt).toLocaleString(),
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
                const isCompleted = track.status === "COMPLETED" && !!track.s3Url;
                const checked = selectedTracks.has(track.id);

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
                            {track.user?.name ?? track.user?.email ?? "Unknown"}
                          </MonoLabel>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <TrackStatusBadge status={track.status} />

                        {isCompleted ? (
                          <a
                            href={track.s3Url!}
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

        {/* ── Text-Based Editing ─────────────────────────────────────────── */}
        {transcript.data && transcript.data.length > 0 && completedTracks.length > 0 && (
          <AnalogCard className="p-6">
            <PanelTitle label="AI Transcript Editor" title="Text-Based Editing" className="mb-4" />
            <MonoLabel className="mb-4 block">
              Click segments to mark them for removal. Removed sections are cut from the final
              export.
            </MonoLabel>

            <div className="max-h-[300px] space-y-1 overflow-y-auto pr-2">
              {transcript.data.map((seg) => {
                const selected = cutSegments.has(seg.id);
                return (
                  <button
                    key={seg.id}
                    onClick={() => toggleCutSegment(seg.id)}
                    className={`w-full rounded px-3 py-2 text-left transition-colors ${
                      selected
                        ? "bg-led-on/10 border-led-on/30 border line-through opacity-60"
                        : "bg-popover/50 hover:bg-popover border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MonoLabel className="text-muted-foreground mt-0.5 shrink-0 text-[9px]">
                        {new Date(seg.startTime * 1000).toISOString().slice(14, 19)}
                      </MonoLabel>
                      <p className="text-foreground/90 font-mono text-[11px] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <MechButton
              onClick={handleCuts}
              disabled={
                cutSegments.size === 0 ||
                processingStatus === "processing" ||
                processingStatus === "loading-ffmpeg"
              }
              className="mt-4 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Scissors className="h-3.5 w-3.5" />
              Remove {cutSegments.size} Selected Segment{cutSegments.size !== 1 ? "s" : ""}
            </MechButton>

            {errorMessage && processingMode === "cuts" && (
              <div className="border-led-on/30 bg-led-on/5 mt-4 flex items-start gap-2 rounded border p-3">
                <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </AnalogCard>
        )}

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
                  selectedTracks.size < 2 ||
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
                  selectedTracks.size === 0 ||
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
                  selectedTracks.size === 0 ||
                  processingStatus === "processing" ||
                  processingStatus === "loading-ffmpeg"
                }
                className="disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export 1080p
              </MechButton>
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
                      {t.type} — {t.user?.name ?? t.user?.email ?? "Unknown"}
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
    </div>
  );
}
