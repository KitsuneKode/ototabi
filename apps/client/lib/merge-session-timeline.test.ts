import { describe, expect, test } from "bun:test";

import {
  countDistinctSyncMarkerTracks,
  getSyncAlignmentWarnings,
  getSyncConfidenceWarning,
} from "./merge-session-timeline";

describe("getSyncAlignmentWarnings", () => {
  test("no warnings for single completed track", () => {
    expect(getSyncAlignmentWarnings({ syncMarkerCount: 0, completedTrackCount: 1 })).toEqual([]);
  });

  test("warns when multi-track has zero markers", () => {
    const warnings = getSyncAlignmentWarnings({ syncMarkerCount: 0, completedTrackCount: 3 });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("No sync markers");
  });

  test("warns on sparse marker count", () => {
    const warnings = getSyncAlignmentWarnings({ syncMarkerCount: 2, completedTrackCount: 2 });
    expect(warnings.some((w) => w.includes("Few sync pulses"))).toBe(true);
  });

  test("warns when markers do not cover all tracks", () => {
    const warnings = getSyncAlignmentWarnings({
      syncMarkerCount: 10,
      completedTrackCount: 3,
      distinctMarkerTrackCount: 1,
    });
    expect(warnings.some((w) => w.includes("cover 1 of 3"))).toBe(true);
  });
});

describe("getSyncConfidenceWarning", () => {
  test("returns first alignment warning", () => {
    expect(getSyncConfidenceWarning({ syncMarkerCount: 0, completedTrackCount: 2 })).toContain(
      "No sync markers",
    );
  });
});

describe("countDistinctSyncMarkerTracks", () => {
  test("counts unique trackSid values", () => {
    expect(
      countDistinctSyncMarkerTracks([
        { id: "1", localTime: 0, createdAt: new Date(), trackSid: "A" },
        { id: "2", localTime: 1, createdAt: new Date(), trackSid: "A" },
        { id: "3", localTime: 2, createdAt: new Date(), trackSid: "B" },
      ]),
    ).toBe(2);
  });
});
