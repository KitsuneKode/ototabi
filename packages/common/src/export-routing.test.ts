import { describe, expect, test } from "bun:test";

import {
  exportSessionJobId,
  resolveSessionDurationSec,
  resolveSessionExportRoute,
  SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS,
  SESSION_EXPORT_WORKER_MIN_DURATION_SEC,
} from "./export-routing";

describe("export-routing", () => {
  test("exportSessionJobId is stable per session and preset", () => {
    expect(exportSessionJobId("sess-1", "episode_mp3")).toBe("export-session-sess-1-episode_mp3");
    expect(exportSessionJobId("sess-1", "landscape_16_9")).toBe(
      "export-session-sess-1-landscape_16_9",
    );
  });

  test("resolveSessionDurationSec uses endedAt when present", () => {
    const startedAt = new Date("2026-05-01T10:00:00Z");
    const endedAt = new Date("2026-05-01T10:45:00Z");
    expect(resolveSessionDurationSec({ startedAt, endedAt })).toBe(45 * 60);
  });

  test("resolveSessionExportRoute prefers worker for long sessions", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: SESSION_EXPORT_WORKER_MIN_DURATION_SEC,
        completedTrackCount: 1,
      }),
    ).toBe("worker");
  });

  test("resolveSessionExportRoute prefers worker for many completed tracks", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: 60,
        completedTrackCount: SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS,
      }),
    ).toBe("worker");
  });

  test("resolveSessionExportRoute allows browser for short light sessions", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: 600,
        completedTrackCount: 2,
      }),
    ).toBe("browser");
  });
});
