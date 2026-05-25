import {
  assertReelsPresetId,
  getReelsPreset,
  listReelsPresets,
} from "@ototabi/common/reels-presets";
import { describe, expect, test } from "bun:test";

describe("reels presets", () => {
  test("lists shipped presets", () => {
    const ids = listReelsPresets().map((p) => p.id);
    expect(ids).toContain("bold-captions");
    expect(ids).toContain("minimal-lower-third");
  });

  test("assertReelsPresetId rejects unknown", () => {
    expect(() => assertReelsPresetId("nope")).toThrow(/Unknown reels preset/);
  });

  test("getReelsPreset returns bold-captions", () => {
    const preset = getReelsPreset("bold-captions");
    expect(preset?.captionPosition).toBe("bottom");
  });
});
