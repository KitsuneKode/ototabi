import type { LlmJobData, LlmJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { getClipsQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

export async function processLlmJob(job: Job<LlmJobData>): Promise<LlmJobResult> {
  const { sessionId } = job.data;

  if (!OPENAI_API_KEY) {
    console.log(`[LLM] No OPENAI_API_KEY set, skipping session ${sessionId}`);
    return {};
  }

  // Check for existing show notes
  const existingNotes = await prisma.showNotes.findUnique({
    where: { sessionId },
  });
  if (existingNotes) {
    console.log(`[LLM] Session ${sessionId} already has show notes, skipping`);
    return {};
  }

  // Get transcript segments
  const segments = await prisma.transcriptSegment.findMany({
    where: { sessionId },
    orderBy: { startTime: "asc" },
  });

  if (segments.length === 0) {
    console.log(`[LLM] No transcript segments for session ${sessionId}, skipping`);
    return {};
  }

  const transcriptWithTimestamps = segments
    .map((s) => `[${Math.floor(s.startTime)}s] ${s.text}`)
    .join("\n");

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

    // Parse JSON (handle markdown code blocks)
    const jsonStr = content.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr) as LlmJobResult;

    // Store chapters
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

    // Store show notes
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

    try {
      await getClipsQueue().add(
        `clips-${sessionId}`,
        { sessionId },
        { jobId: `clips-${sessionId}` },
      );
    } catch {
      // clips queue optional in dev
    }

    return parsed;
  } catch (error) {
    console.error(`[LLM] Failed for session ${sessionId}:`, error);
    throw error;
  }
}
