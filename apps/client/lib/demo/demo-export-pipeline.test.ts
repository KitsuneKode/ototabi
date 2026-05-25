import { describe, expect, test } from "bun:test";

import {
  buildAtempoChain,
  buildDemoFfmpegExecArgs,
  buildDemoVideoFilterGraph,
  buildSetptsForSpeed,
  trimFilterArgs,
} from "@/lib/demo/demo-export-pipeline";

describe("demo export pipeline", () => {
  test("trimFilterArgs builds start/end filters", () => {
    expect(trimFilterArgs(1000, 5000)).toContain("trim=start=1.000:end=5.000");
    expect(trimFilterArgs(null, 3000)).toContain("trim=end=3.000");
    expect(trimFilterArgs(2000, null)).toContain("trim=start=2.000");
    expect(trimFilterArgs(null, null)).toBe("");
  });

  test("buildSetptsForSpeed returns empty at 1x", () => {
    expect(buildSetptsForSpeed(1)).toBe("");
    expect(buildSetptsForSpeed(1.5)).toContain("setpts=PTS/");
  });

  test("buildAtempoChain chains for speeds above 2", () => {
    expect(buildAtempoChain(1)).toBe("");
    expect(buildAtempoChain(4)).toContain("atempo=2");
  });

  test("buildDemoVideoFilterGraph includes PiP overlay when camera enabled", () => {
    const { filterComplex } = buildDemoVideoFilterGraph({
      aspectPreset: "16:9",
      edit: {
        trimStartMs: null,
        trimEndMs: null,
        playbackSpeed: 1,
        backgroundBlur: 0,
        pipEnabled: true,
      },
      hasCamera: true,
    });
    expect(filterComplex).toContain("overlay=");
    expect(filterComplex).toContain("[pip]");
  });

  test("buildDemoFfmpegExecArgs maps display + mic inputs", () => {
    const args = buildDemoFfmpegExecArgs({
      inputs: {
        displayFile: "demo_display.mp4",
        cameraFile: null,
        micFile: "demo_mic.mp4",
      },
      aspectPreset: "9:16",
      edit: {
        trimStartMs: 500,
        trimEndMs: 10_000,
        playbackSpeed: 1.25,
        backgroundBlur: 2,
        pipEnabled: false,
      },
      noiseReduction: true,
    });
    expect(args).toContain("-i");
    expect(args).toContain("demo_display.mp4");
    expect(args).toContain("demo_mic.mp4");
    expect(args.join(" ")).toContain("filter_complex");
    expect(args).toContain("libx264");
  });
});
