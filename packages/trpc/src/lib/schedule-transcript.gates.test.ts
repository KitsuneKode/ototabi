import { transcriptJobId } from "@ototabi/common/pipeline-status";
import { describe, expect, test } from "bun:test";

import {
  evaluateScheduleTranscript,
  evaluateTranscriptPlanGate,
} from "./schedule-transcript.gates";

describe("transcriptJobId", () => {
  test("uses transcript-{sessionId} for BullMQ dedup", () => {
    expect(transcriptJobId("sess-abc")).toBe("transcript-sess-abc");
  });
});

describe("evaluateScheduleTranscript", () => {
  test("blocks incomplete sessions", () => {
    expect(
      evaluateScheduleTranscript({
        sessionStatus: "RECORDING",
        transcriptStatus: "pending",
        hasSegments: false,
        hasAudioKey: true,
      }),
    ).toEqual({ status: "session_not_complete" });
  });

  test("returns already_ready when segments exist and not forced", () => {
    expect(
      evaluateScheduleTranscript({
        sessionStatus: "COMPLETED",
        transcriptStatus: "ready",
        hasSegments: true,
        hasAudioKey: true,
      }),
    ).toEqual({ status: "already_ready" });
  });

  test("force bypasses already_ready", () => {
    expect(
      evaluateScheduleTranscript({
        sessionStatus: "COMPLETED",
        transcriptStatus: "ready",
        hasSegments: true,
        hasAudioKey: true,
        force: true,
      }),
    ).toEqual({ status: "queued" });
  });

  test("waits for upload when no audio key", () => {
    expect(
      evaluateScheduleTranscript({
        sessionStatus: "COMPLETED",
        transcriptStatus: "pending",
        hasSegments: false,
        hasAudioKey: false,
      }),
    ).toEqual({ status: "waiting_for_upload" });
  });
});

describe("evaluateTranscriptPlanGate (trial teaser)", () => {
  test("allows first Trial lifetime transcript", () => {
    expect(evaluateTranscriptPlanGate({ effectivePlan: "TRIAL", lifetimeTranscriptCount: 0 })).toBe(
      "queued",
    );
  });

  test("blocks second Trial lifetime transcript", () => {
    expect(evaluateTranscriptPlanGate({ effectivePlan: "TRIAL", lifetimeTranscriptCount: 1 })).toBe(
      "plan_upgrade_required",
    );
  });

  test("allows Pro regardless of lifetime count", () => {
    expect(evaluateTranscriptPlanGate({ effectivePlan: "PRO", lifetimeTranscriptCount: 99 })).toBe(
      "queued",
    );
  });

  test("blocks Creator without Pro", () => {
    expect(
      evaluateTranscriptPlanGate({ effectivePlan: "CREATOR", lifetimeTranscriptCount: 0 }),
    ).toBe("plan_upgrade_required");
  });
});
