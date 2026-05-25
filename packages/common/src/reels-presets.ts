import { z } from "zod";

export const reelsCaptionPositionSchema = z.enum(["bottom", "lower_third"]);

export const reelsPresetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  captionPosition: reelsCaptionPositionSchema,
  fontSize: z.number().int().min(24).max(96),
  marginBottom: z.number().int().min(40).max(400),
  fontColor: z.string().default("white"),
  boxBorderWidth: z.number().int().min(0).max(12).default(0),
  boxColor: z.string().optional(),
});

export type ReelsPreset = z.infer<typeof reelsPresetSchema>;

export const REELS_PRESETS: ReelsPreset[] = [
  {
    id: "bold-captions",
    label: "Bold captions",
    description: "Large bottom captions for short-form hooks.",
    captionPosition: "bottom",
    fontSize: 52,
    marginBottom: 120,
    fontColor: "white",
    boxBorderWidth: 4,
    boxColor: "black@0.55",
  },
  {
    id: "minimal-lower-third",
    label: "Minimal lower third",
    description: "Quiet lower-third line for interview clips.",
    captionPosition: "lower_third",
    fontSize: 36,
    marginBottom: 200,
    fontColor: "white",
    boxBorderWidth: 0,
  },
];

export const REELS_PRESET_IDS = REELS_PRESETS.map((p) => p.id);

export function listReelsPresets(): ReelsPreset[] {
  return REELS_PRESETS;
}

export function getReelsPreset(id: string): ReelsPreset | undefined {
  return REELS_PRESETS.find((p) => p.id === id);
}

export function assertReelsPresetId(id: string): ReelsPreset {
  const preset = getReelsPreset(id);
  if (!preset) {
    throw new Error(`Unknown reels preset: ${id}`);
  }
  return preset;
}
