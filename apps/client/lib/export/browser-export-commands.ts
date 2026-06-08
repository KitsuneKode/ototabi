import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import { resolveTrackDownloadUrls } from "@/lib/resolve-track-download";
import { trpcClient } from "@/trpc/vanilla";

export type TrackWithMedia = {
  s3Url?: string | null;
  s3Key?: string | null;
  trackSid?: string;
};

export type WriteTracksOptions = {
  offsetByTrackSid?: Map<string, number>;
};

/** Per-track audio filters applied before concat (delay only — noise reduction stays on merge). */
export function buildPerTrackAudioFilter(offsetMs: number): string[] {
  if (offsetMs <= 0) return [];
  return [`adelay=${offsetMs}|${offsetMs}`];
}

export function buildMergeAudioFilters(noiseReduction: boolean): string[] {
  return noiseReduction ? ["afftdn"] : [];
}

/** Download tracks in parallel, optionally align each with per-track adelay, then build concat list. */
export async function writeTracksToFfmpeg(
  ffmpeg: FFmpeg,
  tracks: TrackWithMedia[],
  options?: WriteTracksOptions,
): Promise<string> {
  const mediaRefs = tracks.map((track, i) => {
    const mediaRef = track.s3Url ?? track.s3Key;
    if (!mediaRef) throw new Error(`Track ${i + 1} has no media reference`);
    return mediaRef;
  });
  const downloadUrls = await resolveTrackDownloadUrls(trpcClient, mediaRefs);

  const prepared = await Promise.all(
    tracks.map(async (track, i) => {
      const rawName = `input_${i}.mp4`;
      const mediaRef = track.s3Url ?? track.s3Key;
      if (!mediaRef) throw new Error(`Track ${i + 1} has no media reference`);
      const downloadUrl = downloadUrls.get(mediaRef);
      if (!downloadUrl) throw new Error(`Could not resolve download URL for track ${i + 1}`);
      const data = await fetchFile(downloadUrl);
      return { rawName, data, trackSid: track.trackSid, index: i };
    }),
  );

  await Promise.all(prepared.map(({ rawName, data }) => ffmpeg.writeFile(rawName, data)));

  const concatNames: string[] = [];
  for (const { rawName, trackSid, index } of prepared) {
    const offsetMs =
      trackSid && options?.offsetByTrackSid ? (options.offsetByTrackSid.get(trackSid) ?? 0) : 0;
    const audioFilters = buildPerTrackAudioFilter(offsetMs);

    if (audioFilters.length === 0) {
      concatNames.push(rawName);
      continue;
    }

    const alignedName = `aligned_${index}.mp4`;
    await ffmpeg.exec([
      "-i",
      rawName,
      "-af",
      audioFilters.join(","),
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      alignedName,
    ]);
    concatNames.push(alignedName);
  }

  return concatNames.map((name) => `file '${name}'\n`).join("");
}

export function buildMergeArgs(audioFilters: string[]): string[] {
  return [
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
}

export function buildExportArgs(resolution: "720p" | "1080p", audioFilters: string[]): string[] {
  const scale = resolution === "720p" ? "1280:720" : "1920:1080";
  return [
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
}

export function buildTrimArgs(
  trimStart: string,
  trimEnd: string,
  noiseReduction: boolean,
  audioDelayMs = 0,
): string[] {
  const args = ["-i", "input.mp4"];
  if (trimStart) args.push("-ss", String(Number(trimStart)));
  if (trimEnd) {
    args.push("-to", trimEnd);
  }
  const audioFilters = [
    ...buildPerTrackAudioFilter(audioDelayMs),
    ...(noiseReduction ? ["afftdn"] : []),
  ];
  if (audioFilters.length > 0) {
    args.push("-af", audioFilters.join(","), "-c:v", "copy", "-c:a", "aac");
  } else {
    args.push("-c", "copy");
  }
  args.push("output.mp4");
  return args;
}
