import type { LlmJobData, LlmJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { clipsJobId } from "@ototabi/common/pipeline-status";
import { getClipsQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";
const MAX_TRANSCRIPT_CHARS = 24_000;

async function setLlmStatus(
  sessionId: string,
  status: string,
  error: string | null = null,
): Promise<void> {
  await prisma.recordingSession.update({
    where: { id: sessionId },
    data: { llmStatus: status, llmError: error },
  });
}

function truncateTranscript(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  const headLen = Math.floor(MAX_TRANSCRIPT_CHARS * 0.85);
  const tailLen = Math.floor(MAX_TRANSCRIPT_CHARS * 0.1);
  const head = text.slice(0, headLen);
  const tail = text.slice(-tailLen);
  return `${head}\n\n[... transcript truncated for token limit ...]\n\n${tail}`;
}

export async function processLlmJob(job: Job<LlmJobData>): Promise<LlmJobResult> {
  const { sessionId } = job.data;

  if (!OPENAI_API_KEY) {
    console.log(`[LLM] No OPENAI_API_KEY set, skipping session ${sessionId}`);
    await setLlmStatus(sessionId, "skipped", "OPENAI_API_KEY not configured");
    return {};
  }

  const existingNotes = await prisma.showNotes.findUnique({
    where: { sessionId },
  });
  if (existingNotes) {
    console.log(`[LLM] Session ${sessionId} already has show notes, skipping`);
    await setLlmStatus(sessionId, "ready");
    return {};
  }

  const segments = await prisma.transcriptSegment.findMany({
    where: { sessionId },
    orderBy: { startTime: "asc" },
  });

  if (segments.length === 0) {
    console.log(`[LLM] No transcript segments for session ${sessionId}, skipping`);
    await setLlmStatus(sessionId, "skipped", "No transcript segments");
    return {};
  }

  const transcriptWithTimestamps = truncateTranscript(
    segments.map((s) => `[${Math.floor(s.startTime)}s] ${s.text}`).join("\n"),
  );

  await setLlmStatus(sessionId, "processing");
  console.log(`[LLM] Generating chapters and show notes for session ${sessionId}...`);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an AI podcast editor. Analyze this transcript and return JSON:
{
  "chapters": [{ "title": "Chapter name", "startTime": seconds }],
  "showNotes": { "summary": "1-2 paragraph summary", "keywords": ["keyword1"], "seoTitles": ["Title 1", "Title 2", "Title 3"] }
}
Only return valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: transcriptWithTimestamps,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as LlmJobResult;

    if (parsed.chapters?.length) {
      await prisma.chapter.createMany({
        data: parsed.chapters.map((ch) => ({
          sessionId,
          title: ch.title,
          startTime: ch.startTime,
          endTime: ch.endTime || null,
        })),
      });
      console.log(`[LLM] Stored ${parsed.chapters.length} chapters for session ${sessionId}`);
    }

    if (parsed.showNotes) {
      await prisma.showNotes.create({
        data: {
          sessionId,
          summary: parsed.showNotes.summary,
          keywords: parsed.showNotes.keywords,
          seoTitles: parsed.showNotes.seoTitles,
        },
      });
      console.log(`[LLM] Stored show notes for session ${sessionId}`);
    }

    await setLlmStatus(sessionId, "ready");

    try {
      const id = clipsJobId(sessionId);
      await getClipsQueue().add(id, { sessionId }, { jobId: id });
      await prisma.recordingSession.update({
        where: { id: sessionId },
        data: { clipsStatus: "processing", clipsError: null },
      });
    } catch {
      // clips queue optional in dev
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "LLM failed";
    console.error(`[LLM] Failed for session ${sessionId}:`, error);
    await setLlmStatus(sessionId, "failed", message);
    throw error;
  }
}
