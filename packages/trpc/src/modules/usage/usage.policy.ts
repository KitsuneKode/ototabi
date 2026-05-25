import type { Plan } from "@ototabi/store";

import { planGateError, satisfiesMinimumPlan } from "@ototabi/billing/plan-policy";

export const USAGE_KIND = {
  TRANSCRIPT_LIFETIME: "TRANSCRIPT_LIFETIME",
  CLIPS_MONTH: "CLIPS_MONTH",
} as const;

export type UsageKind = (typeof USAGE_KIND)[keyof typeof USAGE_KIND];

export const TRIAL_COMPLETED_SESSION_CAP = 3;
export const CREATOR_CLIPS_PER_MONTH = 10;
export const TRIAL_TRANSCRIPT_LIFETIME_CAP = 1;

export type UsageLimitCode =
  | "session_cap"
  | "clip_cap"
  | "transcript_lifetime_cap"
  | "plan_upgrade_required";

export type UsageLimitResult =
  | { allowed: true }
  | { allowed: false; code: UsageLimitCode; message: string };

/** UTC calendar month key for CLIPS_MONTH counters. */
export function clipsMonthPeriodKey(at = new Date()): string {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function evaluateTrialSessionCap(input: {
  completedSessionCount: number;
  effectivePlan: Plan;
}): UsageLimitResult {
  if (input.effectivePlan !== "TRIAL") {
    return { allowed: true };
  }
  if (input.completedSessionCount >= TRIAL_COMPLETED_SESSION_CAP) {
    return {
      allowed: false,
      code: "session_cap",
      message: `Trial plan allows up to ${TRIAL_COMPLETED_SESSION_CAP} completed sessions. Upgrade to record more.`,
    };
  }
  return { allowed: true };
}

export function evaluateClipMonthlyCap(input: {
  monthlyClipCount: number;
  effectivePlan: Plan;
}): UsageLimitResult {
  if (satisfiesMinimumPlan(input.effectivePlan, "PRO")) {
    return { allowed: true };
  }
  if (input.effectivePlan !== "CREATOR") {
    return { allowed: true };
  }
  if (input.monthlyClipCount >= CREATOR_CLIPS_PER_MONTH) {
    return {
      allowed: false,
      code: "clip_cap",
      message: `Creator plan allows ${CREATOR_CLIPS_PER_MONTH} clip operations per month. Upgrade to Pro for unlimited clips.`,
    };
  }
  return { allowed: true };
}

/**
 * Trial: one lifetime Whisper (teaser). Pro+: unlimited. Creator: blocked (matrix).
 */
export function evaluateTranscriptLifetimeTeaser(input: {
  lifetimeTranscriptCount: number;
  effectivePlan: Plan;
}): UsageLimitResult {
  if (satisfiesMinimumPlan(input.effectivePlan, "PRO")) {
    return { allowed: true };
  }
  if (input.effectivePlan === "TRIAL") {
    if (input.lifetimeTranscriptCount < TRIAL_TRANSCRIPT_LIFETIME_CAP) {
      return { allowed: true };
    }
    return {
      allowed: false,
      code: "transcript_lifetime_cap",
      message:
        "Trial includes one lifetime transcript. Upgrade to Pro for unlimited transcription and chapters.",
    };
  }
  return {
    allowed: false,
    code: "plan_upgrade_required",
    message: planGateError("PRO"),
  };
}

export function transcriptLifetimeLimit(effectivePlan: Plan): number | null {
  if (satisfiesMinimumPlan(effectivePlan, "PRO")) return null;
  if (effectivePlan === "TRIAL") return TRIAL_TRANSCRIPT_LIFETIME_CAP;
  return 0;
}

export function clipsMonthLimit(effectivePlan: Plan): number | null {
  if (satisfiesMinimumPlan(effectivePlan, "PRO")) return null;
  if (effectivePlan === "CREATOR") return CREATOR_CLIPS_PER_MONTH;
  return 0;
}

export function completedSessionsLimit(effectivePlan: Plan): number | null {
  if (effectivePlan === "TRIAL") return TRIAL_COMPLETED_SESSION_CAP;
  return null;
}
