import type { ExportJobData } from "@ototabi/jobs/types";
import type { Job } from "bullmq";

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
