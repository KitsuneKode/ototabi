import { z } from "zod";

export const recordingEventTypeSchema = z.enum([
  "START",
  "STOP",
  "PAUSE",
  "RESUME",
  "JOIN",
  "LEAVE",
  "RECONNECT",
  "TRACK_PUBLISHED",
  "TRACK_UNPUBLISHED",
  "UPLOAD_COMPLETED",
]);

export type RecordingEventType = z.infer<typeof recordingEventTypeSchema>;

export const createRecordingEventSchema = z.object({
  sessionId: z.string(),
  type: recordingEventTypeSchema,
  trackSid: z.string().optional(),
  message: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
