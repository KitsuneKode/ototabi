import type { Plan } from "@ototabi/store";

import { isDodoConfigured } from "./index";

/** Ordered plan tiers for feature gating (Plan 08 matrix). */
export const PLAN_ORDER: Record<Plan, number> = {
  TRIAL: 0,
  CREATOR: 1,
  PRO: 2,
  STUDIO: 3,
};

export type PlanGateInput = {
  plan: Plan;
  status: string;
  trialEndsAt: Date | null;
};

/** Skip API plan gates when billing is not configured (local dev). */
export function shouldBypassPlanGates(): boolean {
  return !isDodoConfigured();
}

export function planRank(plan: Plan): number {
  return PLAN_ORDER[plan] ?? 0;
}

export function satisfiesMinimumPlan(current: Plan, minimum: Plan): boolean {
  return planRank(current) >= planRank(minimum);
}

/**
 * Resolves the plan used for gating. Expired trials stay on TRIAL tier;
 * paid features remain blocked until upgrade.
 */
export function resolveEffectivePlan(sub: PlanGateInput | null | undefined): Plan {
  if (!sub) return "TRIAL";
  if (sub.status === "EXPIRED" || sub.status === "CANCELED") {
    return "TRIAL";
  }
  if (sub.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt.getTime() < Date.now()) {
    return "TRIAL";
  }
  return sub.plan;
}

export function planGateError(minimum: Plan): string {
  return `This feature requires the ${minimum} plan or higher`;
}
