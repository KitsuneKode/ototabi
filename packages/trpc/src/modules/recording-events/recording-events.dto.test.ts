import { describe, expect, test } from "bun:test";

import { createRecordingEventSchema, recordingEventTypeSchema } from "./recording-events.dto";

describe("recording event dto", () => {
  test("accepts supported event types", () => {
    expect(recordingEventTypeSchema.safeParse("START").success).toBe(true);
    expect(recordingEventTypeSchema.safeParse("UPLOAD_COMPLETED").success).toBe(true);
  });

  test("rejects unknown event types", () => {
    expect(recordingEventTypeSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  test("validates event payload shape", () => {
    const parsed = createRecordingEventSchema.safeParse({
      sessionId: "session-1",
      type: "RECONNECT",
      message: "Participant reconnected",
      metadata: { reason: "network" },
    });

    expect(parsed.success).toBe(true);
  });
});
