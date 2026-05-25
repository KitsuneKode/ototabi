// Job data types for BullMQ queues

export interface TranscriptJobData {
  sessionId: string;
  audioTrackS3Key: string;
}

export interface TranscriptJobResult {
  segments: Array<{
    startTime: number;
    endTime: number;
    text: string;
    confidence?: number;
  }>;
}

export interface LlmJobData {
  sessionId: string;
}

export interface LlmJobResult {
  chapters?: Array<{ title: string; startTime: number; endTime?: number }>;
  showNotes?: {
    summary: string;
    keywords: string[];
    seoTitles: string[];
  };
}

export interface ClipsJobData {
  sessionId: string;
}

export interface ClipsJobResult {
  candidates: number;
}

export type ExportPreset = "vertical_9_16" | "landscape_16_9" | "episode_mp3";

export interface ExportJobData {
  sessionId: string;
  clipId?: string;
  preset: ExportPreset;
  /** When set, re-renders a vertical clip with reels caption styling (see @ototabi/common reels-presets). */
  reelsPresetId?: string;
  /** Re-run export even when output is already marked ready. */
  force?: boolean;
  /** Snapshot from queue time — long sessions should always run on the export worker. */
  preferWorker?: boolean;
}

export interface ExportJobResult {
  status: "queued" | "ready" | "failed";
  outputKey?: string;
  errorMessage?: string;
}
