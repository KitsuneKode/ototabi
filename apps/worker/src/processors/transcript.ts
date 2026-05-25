import type { TranscriptJobData, TranscriptJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { resolveMediaFetchUrl } from "@ototabi/backend-common/s3-media";
import { getLlmQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "whisper-1";

export async function processTranscriptJob(
  job: Job<TranscriptJobData>,
): Promise<TranscriptJobResult> {
  const { sessionId, audioTrackS3Key } = job.data;

  // Check if already processed
  const existing = await prisma.transcriptSegment.findFirst({
    where: { sessionId },
  });
  if (existing) {
    console.log(`[Transcript] Session ${sessionId} already has transcript, skipping`);
    return { segments: [] };
  }

  if (!OPENAI_API_KEY) {
    console.log(`[Transcript] No OPENAI_API_KEY set, skipping session ${sessionId}`);
    return { segments: [] };
  }

  console.log(`[Transcript] Transcribing session ${sessionId}...`);

  try {
    // Call Whisper API
    const formData = new FormData();
    formData.append("model", WHISPER_MODEL);
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");

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
        words?: Array<{ word: string; start: number; end: number; confidence: number }>;
      }>;
    };

    const segments = (result.segments || []).map((seg) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text.trim(),
      confidence: seg.confidence,
    }));

    // Store segments in DB
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

      // Chain: queue LLM job for chapters + show notes
      try {
        await getLlmQueue().add(`llm-${sessionId}`, { sessionId });
      } catch {
        // LLM queue is optional
      }
    }

    return { segments };
  } catch (error) {
    console.error(`[Transcript] Failed for session ${sessionId}:`, error);
    throw error;
  }
}
