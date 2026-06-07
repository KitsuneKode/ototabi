import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export async function loadFfmpegInstance(
  ffmpeg: FFmpeg,
  onProgress: (progress: number) => void,
): Promise<void> {
  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm";

  ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
    onProgress(Math.round(p * 100));
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
  });
}

export async function downloadFile(ffmpeg: FFmpeg, filename: string, downloadName: string) {
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

export async function removeTrackInputs(ffmpeg: FFmpeg, trackCount: number): Promise<void> {
  await Promise.all([
    ...Array.from({ length: trackCount }, (_, i) => ffmpeg.deleteFile(`input_${i}.mp4`)),
    ffmpeg.deleteFile("concat_list.txt"),
  ]);
}
