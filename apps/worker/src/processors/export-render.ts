import type { ExportJobData, ExportJobResult, ExportPreset } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import {
  buildClipRenderKey,
  buildClipReelsRenderKey,
  buildSessionRenderKey,
  resolveMediaFetchUrl,
  uploadObjectFromFile,
} from "@ototabi/backend-common/s3-media";
import { exportSessionJobId } from "@ototabi/common/export-routing";
import { assertReelsPresetId } from "@ototabi/common/reels-presets";
import { prisma } from "@ototabi/store";
import { join } from "node:path";

import {
  assertFfmpegAvailable,
  downloadMediaToFile,
  renderClipToFile,
  renderEpisodeMp3ToFile,
  renderLandscapeEpisodeToFile,
  withTempDir,
  type ClipRenderPreset,
} from "@/lib/ffmpeg";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Export render failed";
}

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

function clipPresetToRender(preset: ExportPreset): ClipRenderPreset {
  return preset === "vertical_9_16" ? "vertical_9_16" : "landscape_16_9";
}

async function markSessionExportProcessing(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
) {
  if (preset === "episode_mp3") {
    await prisma.recordingSession.update({
      where: { id: sessionId },
      data: { episodeMp3Status: "processing", episodeMp3Error: null },
    });
    return;
  }
  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: { landscapeStatus: "processing", landscapeError: null },
  });
}

async function markSessionExportFailed(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
  message: string,
) {
  if (preset === "episode_mp3") {
    await prisma.recordingSession.update({
      where: { id: sessionId },
      data: { episodeMp3Status: "failed", episodeMp3Error: message },
    });
    return;
  }
  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: { landscapeStatus: "failed", landscapeError: message },
  });
}

async function markSessionExportReady(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
  outputKey: string,
) {
  if (preset === "episode_mp3") {
    await prisma.recordingSession.update({
      where: { id: sessionId },
      data: {
        episodeMp3Status: "ready",
        episodeMp3S3Key: outputKey,
        episodeMp3Error: null,
      },
    });
    return;
  }
  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: {
      landscapeStatus: "ready",
      landscapeS3Key: outputKey,
      landscapeError: null,
    },
  });
}

async function processSessionExport(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
  options?: { force?: boolean; preferWorker?: boolean },
): Promise<ExportJobResult> {
  const force = options?.force;
  const session = await prisma.recordingSession.findUnique({
    where: { id: sessionId },
    select: {
      episodeMp3Status: true,
      episodeMp3S3Key: true,
      landscapeStatus: true,
      landscapeS3Key: true,
    },
  });

  const statusField = preset === "episode_mp3" ? "episodeMp3Status" : "landscapeStatus";
  const keyField = preset === "episode_mp3" ? "episodeMp3S3Key" : "landscapeS3Key";
  const currentStatus = session?.[statusField];
  const existingKey = session?.[keyField];

  if (!force && currentStatus === "ready" && existingKey) {
    console.log(`[Export] Session ${sessionId} ${preset} already ready, skipping`);
    return { status: "ready", outputKey: existingKey };
  }

  await markSessionExportProcessing(sessionId, preset);

  const routeLabel = options?.preferWorker ? "worker-first" : "worker";
  console.log(
    `[Export] Session ${sessionId} ${preset} (${routeLabel}) job=${exportSessionJobId(sessionId, preset)}`,
  );

  const source = await findSourceTrack(sessionId);
  if (!source) {
    const msg = `No completed source track for session ${sessionId}`;
    await markSessionExportFailed(sessionId, preset, msg);
    throw new Error(msg);
  }

  const mediaRef = source.s3Url ?? source.s3Key;
  if (!mediaRef) {
    const msg = `Source track has no media reference for session ${sessionId}`;
    await markSessionExportFailed(sessionId, preset, msg);
    throw new Error(msg);
  }

  const outputKey = buildSessionRenderKey(sessionId, preset);
  const fetchUrl = await resolveMediaFetchUrl(mediaRef);
  const audioOnly = source.type === "MICROPHONE";
  const contentType = preset === "episode_mp3" ? "audio/mpeg" : "video/mp4";

  try {
    await assertFfmpegAvailable();

    await withTempDir(`export-session-${sessionId}`, async (dir) => {
      const inputExt = mediaRef.includes(".") ? mediaRef.split(".").pop() : "webm";
      const inputFile = join(dir, `input.${inputExt ?? "webm"}`);
      const outputPath = join(dir, preset === "episode_mp3" ? "output.mp3" : "output.mp4");

      console.log(`[Export] Session ${sessionId} ${preset} from ${source.type}`);

      await downloadMediaToFile(fetchUrl, inputFile);

      if (preset === "episode_mp3") {
        await renderEpisodeMp3ToFile({ inputPath: inputFile, outputPath });
      } else {
        await renderLandscapeEpisodeToFile({
          inputPath: inputFile,
          outputPath,
          audioOnly,
        });
      }

      await uploadObjectFromFile({
        key: outputKey,
        filePath: outputPath,
        contentType,
      });
    });

    await markSessionExportReady(sessionId, preset, outputKey);
    console.log(`[Export] Session ${sessionId} ${preset} ready → ${outputKey}`);
    return { status: "ready", outputKey };
  } catch (error) {
    const msg = errorMessage(error);
    await markSessionExportFailed(sessionId, preset, msg);
    console.error(`[Export] Session ${sessionId} ${preset} failed:`, error);
    throw error instanceof Error ? error : new Error(msg);
  }
}

async function processClipExport(
  sessionId: string,
  clipId: string,
  preset: ExportPreset,
  options?: { reelsPresetId?: string; force?: boolean },
): Promise<ExportJobResult> {
  const clip = await prisma.clipCandidate.findFirst({
    where: { id: clipId, sessionId },
  });
  if (!clip) {
    throw new Error(`Clip ${clipId} not found for session ${sessionId}`);
  }

  const reelsPresetId = options?.reelsPresetId;
  const reelsPreset = reelsPresetId ? assertReelsPresetId(reelsPresetId) : undefined;
  const outputKey = reelsPresetId
    ? buildClipReelsRenderKey(sessionId, clip.id, reelsPresetId)
    : buildClipRenderKey(sessionId, clip.id, preset);

  if (!options?.force && clip.renderStatus === "ready" && clip.renderS3Key === outputKey) {
    console.log(`[Export] Clip ${clip.id} already ready at ${outputKey}, skipping`);
    return { status: "ready", outputKey };
  }

  const source = await findSourceTrack(sessionId);
  if (!source) {
    const msg = `No completed source track for session ${sessionId}`;
    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "failed", renderError: msg },
    });
    throw new Error(msg);
  }

  const mediaRef = source.s3Url ?? source.s3Key;
  if (!mediaRef) {
    const msg = `Source track has no media reference for session ${sessionId}`;
    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "failed", renderError: msg },
    });
    throw new Error(msg);
  }

  const fetchUrl = await resolveMediaFetchUrl(mediaRef);
  const renderPreset = clipPresetToRender(preset);
  const audioOnly = source.type === "MICROPHONE";

  try {
    await assertFfmpegAvailable();

    await withTempDir(`export-${clip.id}`, async (dir) => {
      const inputExt = mediaRef.includes(".") ? mediaRef.split(".").pop() : "webm";
      const inputFile = join(dir, `input.${inputExt ?? "webm"}`);
      const outputPath = join(dir, "output.mp4");

      const label = reelsPresetId ? `${preset}+reels:${reelsPresetId}` : preset;
      console.log(
        `[Export] Rendering clip ${clip.id} (${label}) from ${source.type} ${clip.startTime}s–${clip.endTime}s`,
      );

      await downloadMediaToFile(fetchUrl, inputFile);
      await renderClipToFile({
        inputPath: inputFile,
        outputPath,
        startTime: clip.startTime,
        endTime: clip.endTime,
        preset: renderPreset,
        audioOnly,
        reelsPreset,
        captionText: reelsPreset ? clip.rationale : undefined,
        workDir: dir,
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
        renderError: null,
      },
    });

    console.log(`[Export] Clip ${clip.id} ready → ${outputKey}`);
    return { status: "ready", outputKey };
  } catch (error) {
    const msg = errorMessage(error);
    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: { renderStatus: "failed", renderError: msg },
    });
    console.error(`[Export] Clip ${clip.id} failed:`, error);
    throw error instanceof Error ? error : new Error(msg);
  }
}

export async function processExportJob(job: Job<ExportJobData>): Promise<ExportJobResult> {
  const { sessionId, clipId, preset, reelsPresetId, force } = job.data;

  if (clipId && reelsPresetId) {
    return processClipExport(sessionId, clipId, "vertical_9_16", {
      reelsPresetId,
      force,
    });
  }

  if (!clipId) {
    if (preset !== "episode_mp3" && preset !== "landscape_16_9") {
      throw new Error(`Session export requires episode_mp3 or landscape_16_9, got ${preset}`);
    }
    return processSessionExport(sessionId, preset, { force, preferWorker: job.data.preferWorker });
  }

  return processClipExport(sessionId, clipId, preset, { force });
}
