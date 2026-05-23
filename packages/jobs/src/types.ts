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
