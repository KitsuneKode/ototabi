import type { TranscriptJobData, TranscriptJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { resolveMediaFetchUrl } from "@ototabi/backend-common/s3-media";
import { llmJobId } from "@ototabi/common/pipeline-status";
import { getLlmQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "whisper-1";

async function setTranscriptStatus(
  sessionId: string,
  status: string,
  error: string | null = null,
): Promise<void> {
  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: { transcriptStatus: status, transcriptError: error },
  });
}

export async function processTranscriptJob(
  job: Job<TranscriptJobData>,
): Promise<TranscriptJobResult> {
  const { sessionId } = job.data;
  let { audioTrackS3Key } = job.data;

  const existing = await prisma.transcriptSegment.findFirst({
    where: { sessionId },
  });
  if (existing) {
    console.log(`[Transcript] Session ${sessionId} already has transcript, skipping`);
    await setTranscriptStatus(sessionId, "ready");
    return { segments: [] };
  }

  if (!OPENAI_API_KEY) {
    console.log(`[Transcript] No OPENAI_API_KEY set, skipping session ${sessionId}`);
    await setTranscriptStatus(sessionId, "skipped", "OPENAI_API_KEY not configured");
    return { segments: [] };
  }

  if (!audioTrackS3Key) {
    const audioTrack = await prisma.recordingTrack.findFirst({
      where: {
        sessionId,
        type: "MICROPHONE",
        status: "COMPLETED",
        OR: [{ s3Key: { not: "" } }, { s3Url: { not: null } }],
      },
      select: { s3Key: true },
    });
    audioTrackS3Key = audioTrack?.s3Key ?? "";
  }

  if (!audioTrackS3Key) {
    throw new Error(
      `No completed microphone track for session ${sessionId} — retry after upload finishes`,
    );
  }

  await setTranscriptStatus(sessionId, "processing");

  console.log(`[Transcript] Transcribing session ${sessionId}...`);

  try {
    const formData = new FormData();
    formData.append("model", WHISPER_MODEL);
    formData.append("response_format", "verbose_json");

    const fetchUrl = await resolveMediaFetchUrl(audioTrackS3Key);
    const audioResponse = await fetch(fetchUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio from S3: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();
    formData.append("file", audioBlob, "audio.webm");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const err = await whisperResponse.text();
      throw new Error(`Whisper API error: ${whisperResponse.status} ${err}`);
    }

    const result = (await whisperResponse.json()) as {
      text: string;
      segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
        confidence?: number;
      }>;
    };

    const segments = (result.segments || []).map((seg) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text.trim(),
      confidence: seg.confidence,
    }));

    if (segments.length > 0) {
      await prisma.transcriptSegment.createMany({
        data: segments.map((seg) => ({
          sessionId,
          startTime: seg.startTime,
          endTime: seg.endTime,
          text: seg.text,
          confidence: seg.confidence ?? null,
        })),
      });

      console.log(`[Transcript] Stored ${segments.length} segments for session ${sessionId}`);
      await setTranscriptStatus(sessionId, "ready");

      try {
        const id = llmJobId(sessionId);
        await getLlmQueue().add(id, { sessionId }, { jobId: id });
        await prisma.recordingSession.update({
          where: { id: sessionId },
          data: { llmStatus: "processing", llmError: null },
        });
      } catch {
        // LLM queue is optional
      }
    } else {
      await setTranscriptStatus(sessionId, "failed", "Whisper returned no segments");
    }

    return { segments };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcript failed";
    console.error(`[Transcript] Failed for session ${sessionId}:`, error);
    await setTranscriptStatus(sessionId, "failed", message);
    throw error;
  }
}
