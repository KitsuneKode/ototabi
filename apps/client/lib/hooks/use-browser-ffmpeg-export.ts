"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { useCallback, useRef } from "react";

import type { BackgroundBlurPreset } from "@/lib/demo/demo-background-presets";
import type { DemoAspectPreset } from "@/lib/demo/demo-export-presets";
import type { SessionReviewSession } from "@/lib/trpc/router-types";

import { computeKeepRanges } from "@/lib/cut-preview";
import { isValidBlurPreset } from "@/lib/demo/demo-background-presets";
import {
  buildDemoFfmpegExecArgs,
  removeDemoExportInputs,
  resolveDemoExportTracks,
  writeDemoInputsToFfmpeg,
} from "@/lib/demo/demo-export-pipeline";
import {
  writeTracksToFfmpeg,
  buildMergeArgs,
  buildMergeAudioFilters,
  buildExportArgs,
  buildTrimArgs,
} from "@/lib/export/browser-export-commands";
import { loadFfmpegInstance, downloadFile, removeTrackInputs } from "@/lib/export/browser-ffmpeg";
import {
  useExportCuts,
  useExportProcessing,
  useExportTrackSelection,
  useExportTrim,
} from "@/lib/hooks/use-export-console";
import { resolveTrackDownloadUrl, resolveTrackDownloadUrls } from "@/lib/resolve-track-download";
import { trpcClient } from "@/trpc/vanilla";

type DemoEditSnapshot = {
  trimStartMs: number | null;
  trimEndMs: number | null;
  playbackSpeed: number;
  backgroundBlur: number;
  pipEnabled: boolean;
};

type UseBrowserFfmpegExportParams = {
  sessionId: string;
  session: SessionReviewSession | undefined;
  offsetByTrackSid: Map<string, number>;
  demoEdit?: DemoEditSnapshot | null;
  transcriptSegments?: Array<{
    id: string;
    startTime: number;
    endTime: number;
  }>;
};

export function useBrowserFfmpegExport({
  sessionId,
  session,
  offsetByTrackSid,
  demoEdit,
  transcriptSegments,
}: UseBrowserFfmpegExportParams) {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const getFfmpeg = useCallback(() => (ffmpegRef.current ??= new FFmpeg()), []);

  const {
    ffmpegLoaded,
    beginProcessing,
    setFfmpegLoaded,
    setProcessingStatus,
    setProgress,
    setErrorMessage,
    noiseReduction,
  } = useExportProcessing();
  const { selectedTrackIds } = useExportTrackSelection();
  const { trimTrackId, trimStart, trimEnd } = useExportTrim();
  const { cutSegmentIds, clearCutSegments } = useExportCuts();

  const loadFfmpeg = useCallback(async () => {
    if (ffmpegLoaded) return;
    setProcessingStatus("loading-ffmpeg");
    setErrorMessage("");
    try {
      await loadFfmpegInstance(getFfmpeg(), setProgress);
      setFfmpegLoaded(true);
      setProcessingStatus("idle");
    } catch (err) {
      setProcessingStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to load FFmpeg");
    }
  }, [ffmpegLoaded, getFfmpeg, setErrorMessage, setFfmpegLoaded, setProcessingStatus, setProgress]);

  const handleMerge = useCallback(async () => {
    if (!session) return;
    const tracks = session.tracks.filter(
      (t) => selectedTrackIds.includes(t.id) && t.status === "COMPLETED" && (t.s3Url || t.s3Key),
    );
    if (tracks.length < 2) return;

    beginProcessing("merge");

    try {
      await loadFfmpeg();
      const ffmpeg = getFfmpeg();
      const content = await writeTracksToFfmpeg(ffmpeg, tracks, { offsetByTrackSid });
      await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
      await ffmpeg.exec(buildMergeArgs(buildMergeAudioFilters(noiseReduction)));
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
    getFfmpeg,
    sessionId,
    noiseReduction,
    offsetByTrackSid,
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

      beginProcessing(resolution === "720p" ? "720p" : "1080p");

      try {
        await loadFfmpeg();
        const ffmpeg = getFfmpeg();
        const content = await writeTracksToFfmpeg(ffmpeg, tracks, { offsetByTrackSid });
        await ffmpeg.writeFile("concat_list.txt", new TextEncoder().encode(content));
        await ffmpeg.exec(buildExportArgs(resolution, buildMergeAudioFilters(noiseReduction)));
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
      getFfmpeg,
      sessionId,
      noiseReduction,
      offsetByTrackSid,
      setErrorMessage,
      setProcessingStatus,
    ],
  );

  const handleDemoAspectExport = useCallback(
    async (preset: DemoAspectPreset) => {
      if (!session) return;
      const resolved = resolveDemoExportTracks(session.tracks, selectedTrackIds);
      if (!resolved.display) return;

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
        const ffmpeg = getFfmpeg();
        const inputs = await writeDemoInputsToFfmpeg(ffmpeg, {
          display: resolved.display,
          camera: resolved.camera,
          mic: resolved.mic,
        });
        await ffmpeg.exec(
          buildDemoFfmpegExecArgs({ inputs, aspectPreset: preset, edit, noiseReduction }),
        );
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
      demoEdit,
      beginProcessing,
      loadFfmpeg,
      getFfmpeg,
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
      const ffmpeg = getFfmpeg();
      const track = session?.tracks.find((t) => t.id === trimTrackId);
      const mediaRef = track?.s3Url ?? track?.s3Key;
      if (!mediaRef) throw new Error("Track not found");

      const downloadUrl = await resolveTrackDownloadUrl(trpcClient, mediaRef);
      if (!downloadUrl) throw new Error("Could not resolve track download URL");

      await ffmpeg.writeFile("input.mp4", await fetchFile(downloadUrl));
      const trackOffsetMs = track?.trackSid ? (offsetByTrackSid.get(track.trackSid) ?? 0) : 0;
      await ffmpeg.exec(buildTrimArgs(trimStart, trimEnd, noiseReduction, trackOffsetMs));
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
    getFfmpeg,
    sessionId,
    noiseReduction,
    offsetByTrackSid,
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
      const ffmpeg = getFfmpeg();
      const allSegments = transcriptSegments ?? [];
      const sortedCuts = [...segments].toSorted((a, b) => a.startTime - b.startTime);
      const totalDuration = allSegments[allSegments.length - 1]?.endTime ?? 9999;
      const keepRanges = computeKeepRanges(sortedCuts, totalDuration);
      if (keepRanges.length === 0) throw new Error("Cannot cut entire video");

      const downloadUrls = await resolveTrackDownloadUrls(
        trpcClient,
        targetTracks.map((t) => t.s3Url ?? t.s3Key),
      );

      for (let trackIndex = 0; trackIndex < targetTracks.length; trackIndex++) {
        const track = targetTracks[trackIndex]!;
        const mediaRef = track.s3Url ?? track.s3Key;
        if (!mediaRef) continue;

        const downloadUrl = downloadUrls.get(mediaRef);
        if (!downloadUrl)
          throw new Error(`Could not resolve download URL for track ${trackIndex + 1}`);

        await ffmpeg.writeFile("input.mp4", await fetchFile(downloadUrl));

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
    getFfmpeg,
    sessionId,
    clearCutSegments,
    setErrorMessage,
    setProcessingStatus,
  ]);

  return {
    handleMerge,
    handleExportRes,
    handleDemoAspectExport,
    handleTrim,
    handleCuts,
  };
}
