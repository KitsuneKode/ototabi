import { describe, expect, test } from "bun:test";

import type { TrackAlignmentInput } from "./sync-alignment";

import { chooseReferenceTrack, computeTrackAlignmentOffsets } from "./sync-alignment";

function track(trackSid: string, markers: TrackAlignmentInput["markers"]): TrackAlignmentInput {
  return { trackSid, markers };
}

describe("chooseReferenceTrack", () => {
  test("prefers a track with at least three RTP-backed markers", () => {
    expect(
      chooseReferenceTrack([
        track("local-rich", [
          { id: "l1", localTime: 1000 },
          { id: "l2", localTime: 2000 },
          { id: "l3", localTime: 3000 },
          { id: "l4", localTime: 4000 },
        ]),
        track("rtp-ready", [
          { id: "r1", localTime: 1000, rtpTimestamp: 90_000 },
          { id: "r2", localTime: 2000, rtpTimestamp: 180_000 },
          { id: "r3", localTime: 3000, rtpTimestamp: 270_000 },
        ]),
      ]),
    ).toBe("rtp-ready");
  });

  test("falls back to the track with the most local-only markers", () => {
    expect(
      chooseReferenceTrack([
        track("sparse", [{ id: "s1", localTime: 1000 }]),
        track("local-baseline", [
          { id: "l1", localTime: 1000 },
          { id: "l2", localTime: 2000 },
          { id: "l3", localTime: 3000 },
        ]),
      ]),
    ).toBe("local-baseline");
  });

  test("returns null when no track has markers", () => {
    expect(chooseReferenceTrack([track("empty-a", []), track("empty-b", [])])).toBeNull();
  });
});

describe("computeTrackAlignmentOffsets", () => {
  test("returns zero offsets and missing coverage warning when no tracks have markers", () => {
    const result = computeTrackAlignmentOffsets([track("host", []), track("guest", [])]);

    expect(result.referenceTrackSid).toBeNull();
    expect(result.offsets).toEqual([
      {
        trackSid: "host",
        offsetMs: 0,
        confidence: "none",
        markerCount: 0,
        reason: "No sync markers available for alignment.",
      },
      {
        trackSid: "guest",
        offsetMs: 0,
        confidence: "none",
        markerCount: 0,
        reason: "No sync markers available for alignment.",
      },
    ]);
    expect(result.warnings.some((warning) => warning.includes("missing sync coverage"))).toBe(true);
  });

  test("computes a medium-confidence local-only offset with at least three markers", () => {
    const result = computeTrackAlignmentOffsets([
      track("host", [
        { id: "h1", localTime: 1000 },
        { id: "h2", localTime: 2000 },
        { id: "h3", localTime: 3000 },
      ]),
      track("guest", [
        { id: "g1", localTime: 1250 },
        { id: "g2", localTime: 2250 },
        { id: "g3", localTime: 3250 },
      ]),
    ]);

    expect(result.referenceTrackSid).toBe("host");
    expect(result.offsets.find((offset) => offset.trackSid === "host")?.offsetMs).toBe(0);
    expect(result.offsets.find((offset) => offset.trackSid === "guest")).toMatchObject({
      offsetMs: 250,
      confidence: "medium",
      markerCount: 3,
    });
  });

  test("computes a high-confidence RTP-backed offset within five milliseconds", () => {
    const result = computeTrackAlignmentOffsets([
      track("host", [
        { id: "h1", localTime: 1000, rtpTimestamp: 90_000 },
        { id: "h2", localTime: 2000, rtpTimestamp: 180_000 },
        { id: "h3", localTime: 3000, rtpTimestamp: 270_000 },
      ]),
      track("guest", [
        { id: "g1", localTime: 1060, rtpTimestamp: 90_000 },
        { id: "g2", localTime: 2060, rtpTimestamp: 180_000 },
        { id: "g3", localTime: 3060, rtpTimestamp: 270_000 },
      ]),
    ]);

    const guestOffset = result.offsets.find((offset) => offset.trackSid === "guest");

    expect(result.referenceTrackSid).toBe("host");
    expect(guestOffset?.confidence).toBe("high");
    expect(guestOffset?.offsetMs).toBeWithin(55, 65);
  });
});
