import { z } from "zod";

export const submitSyncMarkerSchema = z.object({
  sessionId: z.string(),
  localTime: z.number().nonnegative(),
  rtpTimestamp: z.number().optional(),
  trackSid: z.string().optional(),
});

export const listSyncMarkersSchema = z.object({
  sessionId: z.string(),
});
