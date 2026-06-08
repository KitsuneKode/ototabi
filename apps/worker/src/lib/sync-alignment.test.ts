import { computeTrackAlignmentOffsets } from "@ototabi/common/sync-alignment";
import { describe, expect, test } from "bun:test";

describe("worker/browser alignment parity", () => {
  test("guest track offset matches shared alignment module", () => {
    const result = computeTrackAlignmentOffsets([
      {
        trackSid: "track-1",
        markers: [
          { id: "1", localTime: 1000 },
          { id: "2", localTime: 2000 },
          { id: "3", localTime: 3000 },
        ],
      },
      {
        trackSid: "track-2",
        markers: [
          { id: "4", localTime: 1250 },
          { id: "5", localTime: 2250 },
          { id: "6", localTime: 3250 },
        ],
      },
    ]);

    expect(result.referenceTrackSid).toBe("track-1");
    expect(result.offsets.find((o) => o.trackSid === "track-2")?.offsetMs).toBe(250);
  });
});
