import type { Plan } from "@ototabi/store";

import { evaluateTranscriptLifetimeTeaser } from "../modules/usage/usage.policy";

export type ScheduleTranscriptResult =
  | { status: "queued" }
  | { status: "already_ready" }
  | { status: "waiting_for_upload" }
  | { status: "session_not_complete" }
  | { status: "plan_upgrade_required" };

/** Pure plan gate for transcript scheduling (trial teaser + Pro matrix). */
export function evaluateTranscriptPlanGate(input: {
  effectivePlan: Plan;
  lifetimeTranscriptCount: number;
}): "queued" | "plan_upgrade_required" {
  const gate = evaluateTranscriptLifetimeTeaser({
    lifetimeTranscriptCount: input.lifetimeTranscriptCount,
    effectivePlan: input.effectivePlan,
  });
  return gate.allowed ? "queued" : "plan_upgrade_required";
}

export function evaluateScheduleTranscript(input: {
  sessionStatus: string | undefined;
  transcriptStatus: string;
  hasSegments: boolean;
  hasAudioKey: boolean;
  force?: boolean;
}): ScheduleTranscriptResult {
  if (input.sessionStatus !== "COMPLETED") {
    return { status: "session_not_complete" };
  }
  if (
    input.hasSegments &&
    !input.force &&
    (input.transcriptStatus === "ready" || input.transcriptStatus === "skipped")
  ) {
    return { status: "already_ready" };
  }
  if (!input.hasAudioKey) {
    return { status: "waiting_for_upload" };
  }
  return { status: "queued" };
}
