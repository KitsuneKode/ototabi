import type { ExportJobData } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

import {
  exportSessionJobId,
  resolveSessionExportRoute,
  SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS,
  SESSION_EXPORT_WORKER_MIN_DURATION_SEC,
} from "@ototabi/common/export-routing";
import { clipsJobId, llmJobId, transcriptJobId } from "@ototabi/common/pipeline-status";
import { describe, expect, test } from "bun:test";

import { processExportJob } from "./export-render";

function exportJob(data: ExportJobData): Job<ExportJobData> {
  return { data } as Job<ExportJobData>;
}

describe("pipeline-status job ids", () => {
  test("dedup keys are stable per session", () => {
    expect(transcriptJobId("sess-1")).toBe("transcript-sess-1");
    expect(llmJobId("sess-1")).toBe("llm-sess-1");
    expect(clipsJobId("sess-1")).toBe("clips-sess-1");
  });
});

describe("session export routing", () => {
  test("exportSessionJobId matches queue and worker log id", () => {
    expect(exportSessionJobId("sess-9", "episode_mp3")).toBe("export-session-sess-9-episode_mp3");
  });

  test("long sessions route to worker", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: SESSION_EXPORT_WORKER_MIN_DURATION_SEC,
        completedTrackCount: 1,
      }),
    ).toBe("worker");
  });

  test("multi-track sessions route to worker", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: 300,
        completedTrackCount: SESSION_EXPORT_WORKER_MIN_COMPLETED_TRACKS,
      }),
    ).toBe("worker");
  });

  test("short sessions may use browser merge locally", () => {
    expect(
      resolveSessionExportRoute({
        durationSec: 600,
        completedTrackCount: 2,
      }),
    ).toBe("browser");
  });
});

describe("processExportJob", () => {
  test("rejects invalid session export preset before DB access", async () => {
    await expect(
      processExportJob(
        exportJob({
          sessionId: "sess-1",
          preset: "vertical_9_16",
        }),
      ),
    ).rejects.toThrow("Session export requires episode_mp3 or landscape_16_9");
  });
});
