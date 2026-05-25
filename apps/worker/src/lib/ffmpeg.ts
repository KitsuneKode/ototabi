import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VERTICAL_FILTER =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
const LANDSCAPE_FILTER =
  "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";

export async function assertFfmpegAvailable(): Promise<void> {
  const exit = await runProcess("ffmpeg", ["-version"]);
  if (exit !== 0) {
    throw new Error("ffmpeg is not installed or not on PATH");
  }
}

async function runProcess(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    proc.on("error", reject);
    proc.on("close", (code) => resolve(code ?? 1));
  });
}

export async function downloadMediaToFile(fetchUrl: string, destPath: string): Promise<void> {
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to download source media: HTTP ${response.status}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, data);
}

export type ClipRenderPreset = "vertical_9_16" | "landscape_16_9";

export async function renderClipToFile(params: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  endTime: number;
  preset: ClipRenderPreset;
  audioOnly?: boolean;
}): Promise<void> {
  const duration = Math.max(0.5, params.endTime - params.startTime);
  const vf = params.preset === "vertical_9_16" ? VERTICAL_FILTER : LANDSCAPE_FILTER;

  const args: string[] = ["-y", "-ss", String(params.startTime), "-t", String(duration)];

  if (params.audioOnly) {
    args.push(
      "-f",
      "lavfi",
      "-i",
      `color=c=0x0a0a0a:s=1080x1920:d=${duration}`,
      "-i",
      params.inputPath,
      "-vf",
      vf,
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
      "-shortest",
      params.outputPath,
    );
  } else {
    args.push(
      "-i",
      params.inputPath,
      "-vf",
      vf,
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
      params.outputPath,
    );
  }

  const exit = await runProcess("ffmpeg", args);
  if (exit !== 0) {
    throw new Error(`ffmpeg exited with code ${exit}`);
  }
}

export async function renderLandscapeEpisodeToFile(params: {
  inputPath: string;
  outputPath: string;
  audioOnly?: boolean;
}): Promise<void> {
  const args: string[] = ["-y"];

  if (params.audioOnly) {
    args.push(
      "-f",
      "lavfi",
      "-i",
      "color=c=0x0a0a0a:s=1920x1080:d=1",
      "-i",
      params.inputPath,
      "-vf",
      LANDSCAPE_FILTER,
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
      "-shortest",
      params.outputPath,
    );
  } else {
    args.push(
      "-i",
      params.inputPath,
      "-vf",
      LANDSCAPE_FILTER,
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
      params.outputPath,
    );
  }

  const exit = await runProcess("ffmpeg", args);
  if (exit !== 0) {
    throw new Error(`ffmpeg exited with code ${exit}`);
  }
}

export async function renderEpisodeMp3ToFile(params: {
  inputPath: string;
  outputPath: string;
}): Promise<void> {
  const args = [
    "-y",
    "-i",
    params.inputPath,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "2",
    params.outputPath,
  ];
  const exit = await runProcess("ffmpeg", args);
  if (exit !== 0) {
    throw new Error(`ffmpeg exited with code ${exit}`);
  }
}

export async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = join(tmpdir(), `${prefix}-${crypto.randomUUID()}`);
  await mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
