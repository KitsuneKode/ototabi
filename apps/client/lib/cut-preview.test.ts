import { describe, expect, test } from "bun:test";

import { computeKeepRanges, summarizeCutPreview } from "./cut-preview";

describe("computeKeepRanges", () => {
  test("returns full range when no cuts", () => {
    expect(computeKeepRanges([], 60)).toEqual([{ start: 0, end: 60 }]);
  });

  test("splits around a single cut with gap padding", () => {
    expect(computeKeepRanges([{ startTime: 10, endTime: 20 }], 60)).toEqual([
      { start: 0, end: 9.9 },
      { start: 20.1, end: 60 },
    ]);
  });
});

describe("summarizeCutPreview", () => {
  test("returns null when no cuts", () => {
    expect(summarizeCutPreview([], 100)).toBeNull();
  });
});
