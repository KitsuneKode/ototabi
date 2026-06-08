import { describe, expect, test } from "bun:test";

import { encodeSyncMarkerPayload, type PublishSyncMarkerInput } from "./sync-marker-publisher";

describe("encodeSyncMarkerPayload", () => {
  test("encodes minimal marker payload", () => {
    const input: PublishSyncMarkerInput = {
      sessionId: "sess-1",
      localTime: 1234.5,
    };
    const decoded = JSON.parse(new TextDecoder().decode(encodeSyncMarkerPayload(input)));
    expect(decoded).toEqual({
      type: "sync_marker",
      sessionId: "sess-1",
      localTime: 1234.5,
    });
  });

  test("includes trackSid and rtpTimestamp when present", () => {
    const input: PublishSyncMarkerInput = {
      sessionId: "sess-2",
      localTime: 2000,
      trackSid: "TR_mic",
      rtpTimestamp: 90_000,
    };
    const decoded = JSON.parse(new TextDecoder().decode(encodeSyncMarkerPayload(input)));
    expect(decoded.trackSid).toBe("TR_mic");
    expect(decoded.rtpTimestamp).toBe(90_000);
  });
});
