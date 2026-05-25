import { describe, expect, test } from "bun:test";

import type { CursorEvent } from "@/lib/demo/demo-types";

import { suggestZoomRegionsFromCursor } from "@/lib/demo/suggest-zoom-from-cursor";

describe("suggestZoomRegionsFromCursor", () => {
  test("returns empty when fewer than three events", () => {
    const events: CursorEvent[] = [
      { t: 0, x: 10, y: 10, type: "down" },
      { t: 100, x: 20, y: 20, type: "move" },
    ];
    expect(suggestZoomRegionsFromCursor(events)).toEqual([]);
  });

  test("clusters pointer-down events into zoom regions", () => {
    const events: CursorEvent[] = [
      { t: 0, x: 100, y: 100, type: "down" },
      { t: 50, x: 110, y: 110, type: "move" },
      { t: 1200, x: 400, y: 400, type: "down" },
      { t: 1250, x: 410, y: 410, type: "move" },
      { t: 2500, x: 800, y: 800, type: "down" },
    ];
    const regions = suggestZoomRegionsFromCursor(events);
    expect(regions.length).toBeGreaterThanOrEqual(2);
    for (const region of regions) {
      expect(region.endMs).toBeGreaterThan(region.startMs);
      expect(region.scale).toBeGreaterThanOrEqual(1);
      expect(region.id).toBeTruthy();
    }
  });

  test("each region spans at least minimum duration", () => {
    const events: CursorEvent[] = [
      { t: 0, x: 1, y: 1, type: "down" },
      { t: 100, x: 2, y: 2, type: "down" },
      { t: 200, x: 3, y: 3, type: "down" },
    ];
    const regions = suggestZoomRegionsFromCursor(events);
    expect(regions.length).toBe(1);
    expect(regions[0]!.endMs - regions[0]!.startMs).toBeGreaterThanOrEqual(1500);
  });
});
