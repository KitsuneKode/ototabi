/** Browser FFmpeg.wasm presets for demo exports. Long sessions may OOM — see DEMO_EXPORT_LIMITS. */
export const DEMO_EXPORT_LIMITS = {
  maxRecommendedMinutes: 15,
  maxHardMinutes: 30,
  note: "FFmpeg.wasm runs in-tab; keep demos under 15 minutes for reliable 1080p export.",
} as const;

export type DemoAspectPreset = "16:9" | "9:16";

export const DEMO_ASPECT_SCALES: Record<DemoAspectPreset, string> = {
  "16:9": "1920:1080",
  "9:16": "1080:1920",
};

export const DEMO_ASPECT_LABELS: Record<DemoAspectPreset, string> = {
  "16:9": "Landscape 16:9",
  "9:16": "Vertical 9:16",
};
