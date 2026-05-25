export const PIPELINE_STATUSES = ["pending", "processing", "ready", "failed", "skipped"] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export function transcriptJobId(sessionId: string): string {
  return `transcript-${sessionId}`;
}

export function llmJobId(sessionId: string): string {
  return `llm-${sessionId}`;
}

export function clipsJobId(sessionId: string): string {
  return `clips-${sessionId}`;
}
