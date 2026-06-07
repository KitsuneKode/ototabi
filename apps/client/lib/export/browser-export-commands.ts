import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { trpcClient } from "@/trpc/vanilla";

export type TrackWithMedia = { s3Url?: string | null; s3Key?: string | null };

/** Download tracks in parallel, then write inputs for ffmpeg concat. */
export async function writeTracksToFfmpeg(
  ffmpeg: FFmpeg,
  tracks: TrackWithMedia[],
): Promise<string> {
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
): string[] {
  const args = ["-i", "input.mp4"];
  if (trimStart) args.push("-ss", String(Number(trimStart)));
  if (trimEnd) {
    args.push("-to", trimEnd);
  }
  if (noiseReduction) {
    args.push("-af", "afftdn", "-c:v", "copy", "-c:a", "aac");
  } else {
    args.push("-c", "copy");
  }
  args.push("output.mp4");
  return args;
}
