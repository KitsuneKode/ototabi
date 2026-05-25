import type { ExportJobData, ExportJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import {
  buildClipRenderKey,
  resolveMediaFetchUrl,
  uploadObjectFromFile,
} from "@ototabi/backend-common/s3-media";
import { prisma } from "@ototabi/store";
import { join } from "node:path";

import {
  assertFfmpegAvailable,
  downloadMediaToFile,
  renderClipToFile,
  withTempDir,
  type ClipRenderPreset,
} from "@/lib/ffmpeg";

async function findSourceTrack(sessionId: string) {
  const tracks = await prisma.recordingTrack.findMany({
    where: {
      sessionId,
      type: { in: ["CAMERA", "SCREENSHARE", "MICROPHONE"] },
      status: "COMPLETED",
      OR: [{ s3Key: { not: "" } }, { s3Url: { not: null } }],
    },
    select: { s3Key: true, s3Url: true, type: true },
  });
  for (const type of ["CAMERA", "SCREENSHARE", "MICROPHONE"] as const) {
    const track = tracks.find((t) => t.type === type);
    if (track) return track;
  }
  return null;
}

function presetToRender(preset: ExportJobData["preset"]): ClipRenderPreset {
  return preset === "vertical_9_16" ? "vertical_9_16" : "landscape_16_9";
}

export async function processExportJob(job: Job<ExportJobData>): Promise<ExportJobResult> {
  const { sessionId, clipId, preset } = job.data;

  if (!clipId) {
    console.log(`[Export] Episode export queued for session ${sessionId} (${preset})`);
    return { status: "queued" };
  }

  const clip = await prisma.clipCandidate.findFirst({
    where: { id: clipId, sessionId },
  });
  if (!clip) {
    throw new Error(`Clip ${clipId} not found for session ${sessionId}`);
  }

  const outputKey = buildClipRenderKey(sessionId, clip.id, preset);

  try {
    await assertFfmpegAvailable();

    const source = await findSourceTrack(sessionId);
    if (!source) {
      throw new Error(`No completed source track for session ${sessionId}`);
    }

    const mediaRef = source.s3Url ?? source.s3Key;
    if (!mediaRef) {
      throw new Error(`Source track has no media reference for session ${sessionId}`);
    }

    const fetchUrl = await resolveMediaFetchUrl(mediaRef);
    const renderPreset = presetToRender(preset);
    const audioOnly = source.type === "MICROPHONE";

    await withTempDir(`export-${clip.id}`, async (dir) => {
      const inputPath = join(dir, "input");
      const outputPath = join(dir, "output.mp4");
      const inputExt = mediaRef.includes(".") ? mediaRef.split(".").pop() : "webm";
      const inputFile = `${inputPath}.${inputExt ?? "webm"}`;

      console.log(
        `[Export] Rendering clip ${clip.id} (${preset}) from ${source.type} ${clip.startTime}s–${clip.endTime}s`,
      );

      await downloadMediaToFile(fetchUrl, inputFile);
      await renderClipToFile({
        inputPath: inputFile,
        outputPath,
        startTime: clip.startTime,
        endTime: clip.endTime,
        preset: renderPreset,
        audioOnly,
      });
      await uploadObjectFromFile({
        key: outputKey,
        filePath: outputPath,
        contentType: "video/mp4",
      });
    });

    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: {
        renderStatus: "ready",
        renderS3Key: outputKey,
      },
    });

    console.log(`[Export] Clip ${clip.id} ready → ${outputKey}`);
    return { status: "ready", outputKey };
  } catch (error) {
    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "failed" },
    });
    console.error(`[Export] Clip ${clip.id} failed:`, error);
    throw error;
  }
}
