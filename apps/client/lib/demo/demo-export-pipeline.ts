import type { FFmpeg } from "@ffmpeg/ffmpeg";

import { fetchFile } from "@ffmpeg/util";

import { blurPresetToFfmpeg, type BackgroundBlurPreset } from "@/lib/demo/demo-background-presets";
import { DEMO_ASPECT_SCALES, type DemoAspectPreset } from "@/lib/demo/demo-export-presets";
import {
  DEMO_DISPLAY_TRACK_SID,
  DEMO_MIC_TRACK_SID,
  DEMO_WEBCAM_TRACK_SID,
} from "@/lib/demo/demo-track-ids";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { trpcClient } from "@/trpc/vanilla";

export type DemoExportTrack = {
  id: string;
  trackSid: string;
  type: string;
  status: string;
  s3Url?: string | null;
  s3Key?: string | null;
};

export type DemoExportEdit = {
  trimStartMs: number | null;
  trimEndMs: number | null;
  playbackSpeed: number;
  backgroundBlur: BackgroundBlurPreset;
  pipEnabled: boolean;
};

export type ResolvedDemoInputs = {
  displayFile: string;
  cameraFile: string | null;
  micFile: string | null;
};

const PIP_W = 320;
const PIP_H = 180;
const PIP_MARGIN = 24;

function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) return 1;
  return Math.min(4, Math.max(0.25, speed));
}

/** atempo supports 0.5–2 per filter; chain for faster/slower exports. */
export function buildAtempoChain(speed: number): string {
  const s = clampSpeed(speed);
  if (Math.abs(s - 1) < 0.001) return "";
  const filters: string[] = [];
  let remaining = s;
  while (remaining > 2.0 + 0.001) {
    filters.push("atempo=2");
    remaining /= 2;
  }
  while (remaining < 0.5 - 0.001) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }
  if (Math.abs(remaining - 1) > 0.001) {
    filters.push(`atempo=${remaining.toFixed(4)}`);
  }
  return filters.join(",");
}

export function buildSetptsForSpeed(speed: number): string {
  const s = clampSpeed(speed);
  if (Math.abs(s - 1) < 0.001) return "";
  return `setpts=PTS/${s.toFixed(4)}`;
}

export function trimFilterArgs(trimStartMs: number | null, trimEndMs: number | null): string {
  if (trimStartMs == null && trimEndMs == null) return "";
  const start = trimStartMs != null && trimStartMs > 0 ? (trimStartMs / 1000).toFixed(3) : null;
  const end = trimEndMs != null && trimEndMs > 0 ? (trimEndMs / 1000).toFixed(3) : null;
  if (start && end) return `trim=start=${start}:end=${end},setpts=PTS-STARTPTS`;
  if (start) return `trim=start=${start},setpts=PTS-STARTPTS`;
  if (end) return `trim=end=${end},setpts=PTS-STARTPTS`;
  return "";
}

export function buildDemoVideoFilterGraph(params: {
  aspectPreset: DemoAspectPreset;
  edit: DemoExportEdit;
  hasCamera: boolean;
}): { filterComplex: string; videoLabel: string } {
  const scale = DEMO_ASPECT_SCALES[params.aspectPreset];
  const speed = clampSpeed(params.edit.playbackSpeed);
  const trim = trimFilterArgs(params.edit.trimStartMs, params.edit.trimEndMs);
  const setpts = buildSetptsForSpeed(speed);
  const blur = blurPresetToFfmpeg(params.edit.backgroundBlur);
  const padScale = `scale=${scale}:force_original_aspect_ratio=decrease,pad=${scale}:(ow-iw)/2:(oh-ih)/2`;

  const mainChain: string[] = [];
  if (trim) mainChain.push(trim);
  if (blur) mainChain.push(blur);
  if (setpts) mainChain.push(setpts);
  mainChain.push(padScale);

  let graph: string;
  if (params.hasCamera && params.edit.pipEnabled) {
    const mainLabel = mainChain.length > 0 ? `[mainv]` : "[0:v]";
    const mainFilter = mainChain.length > 0 ? `[0:v]${mainChain.join(",")}${mainLabel}` : "";
    graph = [
      mainFilter,
      `[1:v]scale=${PIP_W}:${PIP_H}[pip]`,
      `${mainLabel}[pip]overlay=main_w-overlay_w-${PIP_MARGIN}:main_h-overlay_h-${PIP_MARGIN}[outv]`,
    ]
      .filter(Boolean)
      .join(";");
    return { filterComplex: graph, videoLabel: "[outv]" };
  }

  const chain =
    mainChain.length > 0 ? `[0:v]${mainChain.join(",")}[outv]` : `[0:v]${padScale}[outv]`;
  return { filterComplex: chain, videoLabel: "[outv]" };
}

export function resolveDemoExportTracks(
  tracks: DemoExportTrack[],
  selectedTrackIds: string[],
): {
  display: DemoExportTrack | null;
  camera: DemoExportTrack | null;
  mic: DemoExportTrack | null;
} {
  const selected = tracks.filter(
    (t) => selectedTrackIds.includes(t.id) && t.status === "COMPLETED" && (t.s3Url || t.s3Key),
  );

  const display =
    selected.find((t) => t.trackSid === DEMO_DISPLAY_TRACK_SID) ??
    selected.find((t) => t.type === "SCREENSHARE") ??
    null;

  const camera =
    selected.find((t) => t.trackSid === DEMO_WEBCAM_TRACK_SID) ??
    selected.find((t) => t.type === "CAMERA") ??
    null;
  const mic =
    selected.find((t) => t.trackSid === DEMO_MIC_TRACK_SID) ??
    selected.find((t) => t.type === "MICROPHONE") ??
    null;

  return { display, camera, mic };
}

export async function writeDemoInputsToFfmpeg(
  ffmpeg: FFmpeg,
  tracks: { display: DemoExportTrack; camera: DemoExportTrack | null; mic: DemoExportTrack | null },
): Promise<ResolvedDemoInputs> {
  const writeOne = async (track: DemoExportTrack, name: string) => {
    const mediaRef = track.s3Url ?? track.s3Key;
    if (!mediaRef) throw new Error("Track has no media reference");
    const url = await resolveTrackDownloadUrl(trpcClient, mediaRef);
    if (!url) throw new Error("Could not resolve track download URL");
    const data = await fetchFile(url);
    await ffmpeg.writeFile(name, data);
  };

  await writeOne(tracks.display, "demo_display.mp4");
  const cameraFile = tracks.camera ? "demo_camera.mp4" : null;
  const micFile = tracks.mic ? "demo_mic.mp4" : null;
  if (tracks.camera && cameraFile) await writeOne(tracks.camera, cameraFile);
  if (tracks.mic && micFile) await writeOne(tracks.mic, micFile);

  return { displayFile: "demo_display.mp4", cameraFile, micFile };
}

export function buildDemoFfmpegExecArgs(params: {
  inputs: ResolvedDemoInputs;
  aspectPreset: DemoAspectPreset;
  edit: DemoExportEdit;
  noiseReduction: boolean;
}): string[] {
  const hasCamera = Boolean(params.inputs.cameraFile && params.edit.pipEnabled);
  const hasMic = Boolean(params.inputs.micFile);
  const { filterComplex: videoGraph, videoLabel } = buildDemoVideoFilterGraph({
    aspectPreset: params.aspectPreset,
    edit: params.edit,
    hasCamera,
  });

  const args: string[] = ["-i", params.inputs.displayFile];
  if (hasCamera && params.inputs.cameraFile) args.push("-i", params.inputs.cameraFile);
  if (hasMic && params.inputs.micFile) args.push("-i", params.inputs.micFile);

  const audioFilters: string[] = [];
  if (params.noiseReduction) audioFilters.push("afftdn");
  const atempo = buildAtempoChain(params.edit.playbackSpeed);
  if (atempo) audioFilters.push(atempo);

  let filterComplex = videoGraph;
  let mapAudio: string | null = null;

  let directMicMap: string | null = null;
  if (hasMic) {
    const micIdx = hasCamera ? 2 : 1;
    if (audioFilters.length > 0) {
      filterComplex = `${filterComplex};[${micIdx}:a]${audioFilters.join(",")}[outa]`;
      mapAudio = "[outa]";
    } else {
      directMicMap = `${micIdx}:a`;
    }
  } else if (audioFilters.length > 0) {
    filterComplex = `${filterComplex};[0:a]${audioFilters.join(",")}[outa]`;
    mapAudio = "[outa]";
  }

  args.push("-filter_complex", filterComplex);
  args.push("-map", videoLabel);
  if (mapAudio) args.push("-map", mapAudio);
  else if (directMicMap) args.push("-map", directMicMap);
  else args.push("-map", "0:a?");

  args.push(
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
  );

  return args;
}

export async function removeDemoExportInputs(
  ffmpeg: FFmpeg,
  inputs: ResolvedDemoInputs,
): Promise<void> {
  const files = [inputs.displayFile, inputs.cameraFile, inputs.micFile].filter((f): f is string =>
    Boolean(f),
  );
  await Promise.all(files.map((f) => ffmpeg.deleteFile(f)));
}
