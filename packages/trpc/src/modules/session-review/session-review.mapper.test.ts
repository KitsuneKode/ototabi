import { describe, expect, test } from "bun:test";

import { mapAiUiStatus, mapTranscriptUiStatus } from "./session-review.mapper";

describe("mapTranscriptUiStatus", () => {
  test("prefers segments over db pending", () => {
    expect(
      mapTranscriptUiStatus({
        sessionStatus: "COMPLETED",
        dbStatus: "pending",
        hasSegments: true,
        micReady: true,
      }),
    ).toBe("ready");
  });

  test("maps db processing to queued", () => {
    expect(
      mapTranscriptUiStatus({
        sessionStatus: "COMPLETED",
        dbStatus: "processing",
        hasSegments: false,
        micReady: true,
      }),
    ).toBe("queued");
  });

  test("maps db failed and skipped", () => {
    expect(
      mapTranscriptUiStatus({
        sessionStatus: "COMPLETED",
        dbStatus: "failed",
        hasSegments: false,
        micReady: true,
      }),
    ).toBe("failed");
    expect(
      mapTranscriptUiStatus({
        sessionStatus: "COMPLETED",
        dbStatus: "skipped",
        hasSegments: false,
        micReady: true,
      }),
    ).toBe("skipped");
  });

  test("waiting upload when mic not ready", () => {
    expect(
      mapTranscriptUiStatus({
        sessionStatus: "COMPLETED",
        dbStatus: "pending",
        hasSegments: false,
        micReady: false,
      }),
    ).toBe("waiting_upload");
  });
});

describe("mapAiUiStatus", () => {
  test("failed when any pipeline step failed", () => {
    expect(
      mapAiUiStatus({
        sessionStatus: "COMPLETED",
        transcriptDbStatus: "ready",
        llmDbStatus: "failed",
        clipsDbStatus: "pending",
        hasTranscript: true,
        hasAiArtifacts: false,
      }),
    ).toBe("failed");
  });

  test("ready when artifacts exist", () => {
    expect(
      mapAiUiStatus({
        sessionStatus: "COMPLETED",
        transcriptDbStatus: "ready",
        llmDbStatus: "processing",
        clipsDbStatus: "pending",
        hasTranscript: true,
        hasAiArtifacts: true,
      }),
    ).toBe("ready");
  });

  test("processing while llm runs after transcript", () => {
    expect(
      mapAiUiStatus({
        sessionStatus: "COMPLETED",
        transcriptDbStatus: "ready",
        llmDbStatus: "processing",
        clipsDbStatus: "pending",
        hasTranscript: true,
        hasAiArtifacts: false,
      }),
    ).toBe("processing");
  });
});
