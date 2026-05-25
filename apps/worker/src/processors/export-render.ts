import type { ExportJobData, ExportJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { buildObjectKey } from "@ototabi/backend-common/s3-media";
import { prisma } from "@ototabi/store";

/**
 * Railway-side export job placeholder.
 * Marks clip candidates ready for client WASM fallback or future FFmpeg worker binary.
 */
export async function processExportJob(job: Job<ExportJobData>): Promise<ExportJobResult> {
  const { sessionId, clipId, preset } = job.data;

  if (clipId) {
    const clip = await prisma.clipCandidate.findFirst({
      where: { id: clipId, sessionId },
    });
    if (!clip) {
      throw new Error(`Clip ${clipId} not found for session ${sessionId}`);
    }

    const outputKey = buildObjectKey(sessionId, `clip-${clip.id}-9x16`);
    await prisma.clipCandidate.update({
      where: { id: clip.id },
      data: {
        renderStatus: "ready",
        renderS3Key: outputKey,
      },
    });

    console.log(
      `[Export] Queued vertical pack metadata for clip ${clip.id} (${preset}) → ${outputKey}`,
    );
    return { status: "ready", outputKey };
  }

  console.log(`[Export] Episode export queued for session ${sessionId} (${preset})`);
  return { status: "queued" };
}
