import type { CSSProperties } from "react";

import type { DemoBackground } from "@/lib/demo/demo-types";

export type BackgroundBlurPreset = 0 | 1 | 2 | 3;

export const DEMO_BACKGROUND_PRESETS: DemoBackground[] = [
  { type: "solid", value: "#0a0a0a" },
  { type: "solid", value: "#1a1510" },
  { type: "gradient", value: "linear-gradient(135deg,#0a0a0a 0%,#1f2937 50%,#0a0a0a 100%)" },
  { type: "gradient", value: "linear-gradient(180deg,#1a1510 0%,#0a0a0a 60%,#111827 100%)" },
  { type: "gradient", value: "linear-gradient(135deg,#111827 0%,#7c2d12 40%,#0a0a0a 100%)" },
];

export const DEMO_BLUR_PRESETS: {
  level: BackgroundBlurPreset;
  label: string;
  backdropPx: number;
  ffmpeg: string;
}[] = [
  { level: 0, label: "Off", backdropPx: 0, ffmpeg: "" },
  { level: 1, label: "Soft", backdropPx: 6, ffmpeg: "boxblur=2:1" },
  { level: 2, label: "Medium", backdropPx: 12, ffmpeg: "boxblur=5:1" },
  { level: 3, label: "Strong", backdropPx: 20, ffmpeg: "boxblur=10:5" },
];

export function isValidBlurPreset(level: number): level is BackgroundBlurPreset {
  return level === 0 || level === 1 || level === 2 || level === 3;
}

export function blurPresetToFfmpeg(level: BackgroundBlurPreset): string {
  return DEMO_BLUR_PRESETS.find((p) => p.level === level)?.ffmpeg ?? "";
}

function blurPresetBackdrop(level: BackgroundBlurPreset): string | undefined {
  const px = DEMO_BLUR_PRESETS.find((p) => p.level === level)?.backdropPx ?? 0;
  return px > 0 ? `blur(${px}px)` : undefined;
}

export function backgroundToStyle(
  bg: DemoBackground,
  blurLevel: BackgroundBlurPreset = 0,
): CSSProperties {
  const base: CSSProperties =
    bg.type === "gradient" ? { background: bg.value } : { backgroundColor: bg.value };
  const backdrop = blurPresetBackdrop(blurLevel);
  if (backdrop) {
    return { ...base, backdropFilter: backdrop };
  }
  return base;
}
