import { resolveSessionExportRoute } from "@ototabi/common/export-routing";
import { describe, expect, test } from "bun:test";

import { mapAiUiStatus, mapSessionReview, mapTranscriptUiStatus } from "./session-review.mapper";

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

describe("mapSessionReview export routing", () => {
  const baseSession = {
    id: "sess-1",
    mode: "STUDIO",
    status: "COMPLETED",
    startedAt: new Date("2026-05-01T10:00:00Z"),
    endedAt: new Date("2026-05-01T11:00:00Z"),
    createdAt: new Date("2026-05-01T10:00:00Z"),
    updatedAt: new Date("2026-05-01T11:00:00Z"),
    roomId: "room-1",
    room: { id: "room-1", name: "Test", code: "ABC" },
    tracks: [
      {
        id: "t1",
        trackSid: "sid-1",
        type: "MICROPHONE",
        status: "COMPLETED",
        s3Key: "k1",
        s3Url: null,
        sessionId: "sess-1",
        userId: "u1",
        createdAt: new Date("2026-05-01T10:00:00Z"),
        updatedAt: new Date("2026-05-01T11:00:00Z"),
        user: { id: "u1", name: "Host" },
      },
    ],
  };

  test("includes routing hints for refresh-safe export UI", () => {
    const metrics = { durationSec: 3600, completedTrackCount: 1 };
    const mapped = mapSessionReview(
      baseSession,
      {
        events: [],
        syncMarkers: [],
        transcriptSegments: [],
        chapters: [],
        showNotes: null,
        clipCandidates: [],
      },
      {
        episodeMp3Status: "processing",
        episodeMp3S3Key: null,
        episodeMp3Error: null,
        landscapeStatus: "pending",
        landscapeS3Key: null,
        landscapeError: null,
      },
      null,
      { route: resolveSessionExportRoute(metrics), metrics },
    );

    expect(mapped.exports.episodeMp3.status).toBe("processing");
    expect(mapped.exports.routing).toEqual({
      route: "worker",
      preferWorker: true,
      durationSec: 3600,
      completedTrackCount: 1,
    });
  });
});
