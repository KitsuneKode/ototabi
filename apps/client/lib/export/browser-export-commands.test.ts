import { describe, expect, test } from "bun:test";

import {
  buildMergeAudioFilters,
  buildPerTrackAudioFilter,
  buildTrimArgs,
} from "./browser-export-commands";

describe("buildPerTrackAudioFilter", () => {
  test("returns adelay for positive offset", () => {
    expect(buildPerTrackAudioFilter(250)).toEqual(["adelay=250|250"]);
  });

  test("returns empty for zero offset", () => {
    expect(buildPerTrackAudioFilter(0)).toEqual([]);
  });
});

describe("buildMergeAudioFilters", () => {
  test("includes afftdn when noise reduction enabled", () => {
    expect(buildMergeAudioFilters(true)).toEqual(["afftdn"]);
  });

  test("empty when noise reduction disabled", () => {
    expect(buildMergeAudioFilters(false)).toEqual([]);
  });
});

describe("buildTrimArgs", () => {
  test("includes per-track adelay when offset provided", () => {
    const args = buildTrimArgs("0", "10", false, 250);
    expect(args).toContain("-af");
    const afIndex = args.indexOf("-af");
    expect(args[afIndex + 1]).toBe("adelay=250|250");
  });
});
