import { describe, expect, test } from "bun:test";

import { planGateError, planRank, resolveEffectivePlan, satisfiesMinimumPlan } from "./plan-policy";

describe("plan-policy", () => {
  test("plan rank ordering", () => {
    expect(planRank("TRIAL")).toBeLessThan(planRank("CREATOR"));
    expect(planRank("CREATOR")).toBeLessThan(planRank("PRO"));
    expect(planRank("PRO")).toBeLessThan(planRank("STUDIO"));
  });

  test("satisfiesMinimumPlan", () => {
    expect(satisfiesMinimumPlan("PRO", "CREATOR")).toBe(true);
    expect(satisfiesMinimumPlan("CREATOR", "PRO")).toBe(false);
    expect(satisfiesMinimumPlan("STUDIO", "PRO")).toBe(true);
  });

  test("resolveEffectivePlan downgrades expired trial", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(
      resolveEffectivePlan({
        plan: "PRO",
        status: "TRIALING",
        trialEndsAt: past,
      }),
    ).toBe("TRIAL");
  });

  test("resolveEffectivePlan keeps active paid plan", () => {
    expect(
      resolveEffectivePlan({
        plan: "PRO",
        status: "ACTIVE",
        trialEndsAt: null,
      }),
    ).toBe("PRO");
  });

  test("planGateError includes tier name", () => {
    expect(planGateError("PRO")).toContain("PRO");
  });
});
