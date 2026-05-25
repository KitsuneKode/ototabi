/** Browser demo mode API contracts — see `.plans/24-demo-mode-browser.md`. */
import { z } from "zod/v4";

export const cursorEventSchema = z.object({
  t: z.number(),
  x: z.number(),
  y: z.number(),
  type: z.enum(["move", "down", "up"]),
  button: z.number().optional(),
});

export const zoomRegionSchema = z.object({
  id: z.string(),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  scale: z.number().min(1).max(4),
});

export const demoBackgroundSchema = z.object({
  type: z.enum(["solid", "gradient"]),
  value: z.string(),
});

export const startDemoSessionSchema = z.object({});

export const stopDemoSessionSchema = z.object({
  sessionId: z.string(),
  cursorEvents: z.array(cursorEventSchema).max(500_000),
});

export const getDemoSessionSchema = z.object({
  sessionId: z.string(),
});

export const saveDemoEditSchema = z.object({
  sessionId: z.string(),
  zoomRegions: z.array(zoomRegionSchema).max(200),
  trimStartMs: z.number().min(0).nullable().optional(),
  trimEndMs: z.number().min(0).nullable().optional(),
  playbackSpeed: z.number().min(0.25).max(4).optional(),
  backgroundBlur: z.number().int().min(0).max(3).optional(),
  pipEnabled: z.boolean().optional(),
  background: demoBackgroundSchema.optional(),
});

export type CursorEvent = z.infer<typeof cursorEventSchema>;
export type ZoomRegion = z.infer<typeof zoomRegionSchema>;
export type DemoBackground = z.infer<typeof demoBackgroundSchema>;
