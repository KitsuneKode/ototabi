import { describe, expect, test } from "bun:test";

import {
  evaluateRegenerateClips,
  evaluateRegenerateLlm,
  regenBlockMessage,
} from "./ai-regen.policy";

const base = {
  sessionStatus: "COMPLETED" as const,
  transcriptDbStatus: "ready",
  llmDbStatus: "ready",
  clipsDbStatus: "ready",
  hasTranscriptSegments: true,
};

describe("evaluateRegenerateLlm", () => {
  test("allows when transcript ready and llm idle", () => {
    expect(evaluateRegenerateLlm(base)).toEqual({ allowed: true });
  });

  test("blocks incomplete session", () => {
    expect(evaluateRegenerateLlm({ ...base, sessionStatus: "RECORDING" })).toMatchObject({
      allowed: false,
      reason: "session_not_complete",
    });
  });

  test("blocks without transcript", () => {
    expect(
      evaluateRegenerateLlm({
        ...base,
        hasTranscriptSegments: false,
        transcriptDbStatus: "pending",
      }),
    ).toMatchObject({ allowed: false, reason: "no_transcript" });
  });

  test("blocks while llm processing", () => {
    expect(evaluateRegenerateLlm({ ...base, llmDbStatus: "processing" })).toMatchObject({
      allowed: false,
      reason: "pipeline_busy",
    });
  });
});

describe("evaluateRegenerateClips", () => {
  test("allows when transcript ready and pipelines idle", () => {
    expect(evaluateRegenerateClips(base)).toEqual({ allowed: true });
  });

  test("blocks while clips processing", () => {
    expect(evaluateRegenerateClips({ ...base, clipsDbStatus: "processing" })).toMatchObject({
      allowed: false,
      reason: "pipeline_busy",
    });
  });
});

describe("regenBlockMessage", () => {
  test("returns human copy for each reason", () => {
    expect(regenBlockMessage("no_transcript")).toContain("transcript");
    expect(regenBlockMessage("pipeline_busy")).toContain("running");
  });
});
