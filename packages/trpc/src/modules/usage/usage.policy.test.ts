import { describe, expect, test } from "bun:test";

import {
  CREATOR_CLIPS_PER_MONTH,
  TRIAL_COMPLETED_SESSION_CAP,
  TRIAL_TRANSCRIPT_LIFETIME_CAP,
  clipsMonthPeriodKey,
  evaluateClipMonthlyCap,
  evaluateTrialSessionCap,
  evaluateTranscriptLifetimeTeaser,
  transcriptLifetimeLimit,
} from "./usage.policy";

describe("clipsMonthPeriodKey", () => {
  test("formats UTC year-month", () => {
    expect(clipsMonthPeriodKey(new Date("2026-05-15T12:00:00Z"))).toBe("2026-05");
  });
});

describe("evaluateTrialSessionCap", () => {
  test("allows Pro hosts regardless of count", () => {
    expect(evaluateTrialSessionCap({ completedSessionCount: 99, effectivePlan: "PRO" })).toEqual({
      allowed: true,
    });
  });

  test("blocks Trial at cap", () => {
    expect(
      evaluateTrialSessionCap({
        completedSessionCount: TRIAL_COMPLETED_SESSION_CAP,
        effectivePlan: "TRIAL",
      }),
    ).toMatchObject({ allowed: false, code: "session_cap" });
  });

  test("allows Trial below cap", () => {
    expect(
      evaluateTrialSessionCap({
        completedSessionCount: TRIAL_COMPLETED_SESSION_CAP - 1,
        effectivePlan: "TRIAL",
      }),
    ).toEqual({ allowed: true });
  });
});

describe("evaluateClipMonthlyCap", () => {
  test("blocks Creator at monthly limit", () => {
    expect(
      evaluateClipMonthlyCap({
        monthlyClipCount: CREATOR_CLIPS_PER_MONTH,
        effectivePlan: "CREATOR",
      }),
    ).toMatchObject({ allowed: false, code: "clip_cap" });
  });

  test("allows Pro unlimited", () => {
    expect(
      evaluateClipMonthlyCap({
        monthlyClipCount: 100,
        effectivePlan: "PRO",
      }),
    ).toEqual({ allowed: true });
  });
});

describe("evaluateTranscriptLifetimeTeaser", () => {
  test("allows Trial first lifetime transcript", () => {
    expect(
      evaluateTranscriptLifetimeTeaser({
        lifetimeTranscriptCount: 0,
        effectivePlan: "TRIAL",
      }),
    ).toEqual({ allowed: true });
  });

  test("blocks Trial after teaser consumed", () => {
    expect(
      evaluateTranscriptLifetimeTeaser({
        lifetimeTranscriptCount: TRIAL_TRANSCRIPT_LIFETIME_CAP,
        effectivePlan: "TRIAL",
      }),
    ).toMatchObject({ allowed: false, code: "transcript_lifetime_cap" });
  });

  test("allows Pro without lifetime cap", () => {
    expect(
      evaluateTranscriptLifetimeTeaser({
        lifetimeTranscriptCount: 50,
        effectivePlan: "PRO",
      }),
    ).toEqual({ allowed: true });
  });

  test("blocks Creator without Pro", () => {
    expect(
      evaluateTranscriptLifetimeTeaser({
        lifetimeTranscriptCount: 0,
        effectivePlan: "CREATOR",
      }),
    ).toMatchObject({ allowed: false, code: "plan_upgrade_required" });
  });
});

describe("transcriptLifetimeLimit", () => {
  test("returns 1 for Trial and null for Pro", () => {
    expect(transcriptLifetimeLimit("TRIAL")).toBe(1);
    expect(transcriptLifetimeLimit("PRO")).toBeNull();
  });
});
