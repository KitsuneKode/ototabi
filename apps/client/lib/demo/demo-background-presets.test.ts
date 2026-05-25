import { describe, expect, test } from "bun:test";

import {
  DEMO_BLUR_PRESETS,
  blurPresetToFfmpeg,
  isValidBlurPreset,
} from "@/lib/demo/demo-background-presets";

describe("demo background blur presets", () => {
  test("validates blur preset levels 0–3", () => {
    expect(isValidBlurPreset(0)).toBe(true);
    expect(isValidBlurPreset(3)).toBe(true);
    expect(isValidBlurPreset(4)).toBe(false);
    expect(isValidBlurPreset(-1)).toBe(false);
  });

  test("maps levels to ffmpeg boxblur filters", () => {
    expect(blurPresetToFfmpeg(0)).toBe("");
    expect(blurPresetToFfmpeg(1)).toContain("boxblur");
    expect(blurPresetToFfmpeg(3)).toContain("boxblur");
  });

  test("preset table has unique levels", () => {
    const levels = DEMO_BLUR_PRESETS.map((p) => p.level);
    expect(new Set(levels).size).toBe(levels.length);
  });
});
