import type { ClipsJobData, ClipsJobResult } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import { prisma } from "@ototabi/store";

const CLIP_TARGET_COUNT = 5;
const MIN_CLIP_SECONDS = 15;
const MAX_CLIP_SECONDS = 60;

export async function processClipsJob(job: Job<ClipsJobData>): Promise<ClipsJobResult> {
  const { sessionId } = job.data;

  const existing = await prisma.clipCandidate.count({ where: { sessionId } });
  if (existing > 0) {
    console.log(`[Clips] Session ${sessionId} already has ${existing} candidates`);
    return { candidates: existing };
  }

  const segments = await prisma.transcriptSegment.findMany({
    where: { sessionId },
    orderBy: { startTime: "asc" },
  });

  if (segments.length === 0) {
    console.log(`[Clips] No transcript for session ${sessionId}, skipping clip scoring`);
    return { candidates: 0 };
  }

  const windows: Array<{
    startTime: number;
    endTime: number;
    text: string;
    score: number;
    rationale: string;
  }> = [];

  for (let i = 0; i < segments.length; i++) {
    let text = "";
    const startTime = segments[i]!.startTime;
    let endTime = segments[i]!.endTime;
    let j = i;

    while (j < segments.length && endTime - startTime < MAX_CLIP_SECONDS) {
      text += `${segments[j]!.text} `;
      endTime = segments[j]!.endTime;
      j++;
      if (endTime - startTime >= MIN_CLIP_SECONDS) {
        const duration = endTime - startTime;
        const wordCount = text.trim().split(/\s+/).length;
        const hookWords = /\b(why|how|secret|never|always|best|worst|truth)\b/i.test(text)
          ? 0.15
          : 0;
        const energy = Math.min(1, wordCount / (duration * 3));
        const score = Math.min(0.99, 0.35 + energy * 0.4 + hookWords);
        windows.push({
          startTime,
          endTime,
          text: text.trim(),
          score,
          rationale: `Hook/energy window (${wordCount} words, ${Math.round(duration)}s) — ${text.trim().slice(0, 80)}…`,
        });
        break;
      }
    }
  }

  const ranked = [...windows].toSorted((a, b) => b.score - a.score).slice(0, CLIP_TARGET_COUNT);

  if (ranked.length > 0) {
    await prisma.clipCandidate.createMany({
      data: ranked.map((w) => ({
        sessionId,
        startTime: w.startTime,
        endTime: w.endTime,
        score: w.score,
        rationale: w.rationale,
        layout: "vertical_9_16",
        renderStatus: "pending",
      })),
    });
  }

  console.log(`[Clips] Stored ${ranked.length} clip candidates for session ${sessionId}`);
  return { candidates: ranked.length };
}
