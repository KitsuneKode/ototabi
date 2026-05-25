import { z } from "zod/v4";

export const usageKindSchema = z.enum(["TRANSCRIPT_LIFETIME", "CLIPS_MONTH"]);

export type UsageKind = z.infer<typeof usageKindSchema>;

export const usageSnapshotSchema = z.object({
  effectivePlan: z.enum(["TRIAL", "CREATOR", "PRO", "STUDIO"]),
  transcriptLifetime: z.object({
    used: z.number().int().nonnegative(),
    limit: z.number().int().positive().nullable(),
  }),
  clipsMonth: z.object({
    used: z.number().int().nonnegative(),
    limit: z.number().int().positive().nullable(),
    periodKey: z.string(),
  }),
  completedSessions: z.object({
    used: z.number().int().nonnegative(),
    limit: z.number().int().positive().nullable(),
  }),
  features: z.object({
    textBasedEditing: z.boolean(),
  }),
});

export type UsageSnapshot = z.infer<typeof usageSnapshotSchema>;
