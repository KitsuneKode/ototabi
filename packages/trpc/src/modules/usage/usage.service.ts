import {
  planGateError,
  resolveEffectivePlan,
  satisfiesMinimumPlan,
  shouldBypassPlanGates,
} from "@ototabi/billing/plan-policy";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";

import type { UsageSnapshot } from "./usage.dto";

import {
  clipsMonthLimit,
  clipsMonthPeriodKey,
  completedSessionsLimit,
  evaluateClipMonthlyCap,
  evaluateTrialSessionCap,
  evaluateTranscriptLifetimeTeaser,
  transcriptLifetimeLimit,
  USAGE_KIND,
  type UsageLimitResult,
} from "./usage.policy";
import { usageRepository } from "./usage.repository";

function throwUsageLimit(result: Extract<UsageLimitResult, { allowed: false }>): never {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: result.message,
  });
}

export const usageService = {
  async getSnapshot(userId: string): Promise<UsageSnapshot> {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
    const effectivePlan = resolveEffectivePlan(sub);
    const periodKey = clipsMonthPeriodKey();

    const [transcriptUsed, clipsUsed, sessionsUsed] = await Promise.all([
      usageRepository.getCount(userId, USAGE_KIND.TRANSCRIPT_LIFETIME),
      usageRepository.getCount(userId, USAGE_KIND.CLIPS_MONTH, periodKey),
      usageRepository.countCompletedStudioSessionsForHost(userId),
    ]);

    const bypass = shouldBypassPlanGates();

    return {
      effectivePlan,
      transcriptLifetime: {
        used: transcriptUsed,
        limit: transcriptLifetimeLimit(effectivePlan),
      },
      clipsMonth: {
        used: clipsUsed,
        limit: clipsMonthLimit(effectivePlan),
        periodKey,
      },
      completedSessions: {
        used: sessionsUsed,
        limit: completedSessionsLimit(effectivePlan),
      },
      features: {
        textBasedEditing: bypass || satisfiesMinimumPlan(effectivePlan, "PRO"),
      },
    };
  },

  async assertCanStartStudioSession(hostUserId: string): Promise<void> {
    if (shouldBypassPlanGates()) return;

    const sub = await prisma.subscription.findUnique({
      where: { userId: hostUserId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
    const effectivePlan = resolveEffectivePlan(sub);
    const completed = await usageRepository.countCompletedStudioSessionsForHost(hostUserId);
    const gate = evaluateTrialSessionCap({
      completedSessionCount: completed,
      effectivePlan,
    });
    if (!gate.allowed) throwUsageLimit(gate);
  },

  async assertCanUseClipOperation(userId: string): Promise<void> {
    if (shouldBypassPlanGates()) return;

    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
    const effectivePlan = resolveEffectivePlan(sub);
    const periodKey = clipsMonthPeriodKey();
    const monthlyClipCount = await usageRepository.getCount(
      userId,
      USAGE_KIND.CLIPS_MONTH,
      periodKey,
    );
    const gate = evaluateClipMonthlyCap({ monthlyClipCount, effectivePlan });
    if (!gate.allowed) throwUsageLimit(gate);
  },

  async recordClipOperation(userId: string): Promise<void> {
    if (shouldBypassPlanGates()) return;

    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
    const effectivePlan = resolveEffectivePlan(sub);
    if (effectivePlan !== "CREATOR") return;

    const periodKey = clipsMonthPeriodKey();
    await usageRepository.increment(userId, USAGE_KIND.CLIPS_MONTH, periodKey);
  },

  /**
   * Returns whether transcript may be queued for the session host.
   * Increments lifetime counter when a trial teaser slot is consumed.
   */
  async evaluateTranscriptScheduleForHost(
    hostUserId: string,
  ): Promise<"queued" | "plan_upgrade_required"> {
    if (shouldBypassPlanGates()) {
      return "queued";
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId: hostUserId },
      select: { plan: true, status: true, trialEndsAt: true },
    });
    const effectivePlan = resolveEffectivePlan(sub);
    const lifetimeCount = await usageRepository.getCount(
      hostUserId,
      USAGE_KIND.TRANSCRIPT_LIFETIME,
    );
    const gate = evaluateTranscriptLifetimeTeaser({
      lifetimeTranscriptCount: lifetimeCount,
      effectivePlan,
    });

    if (!gate.allowed) {
      if (gate.code === "plan_upgrade_required" || gate.code === "transcript_lifetime_cap") {
        return "plan_upgrade_required";
      }
      return "plan_upgrade_required";
    }

    if (effectivePlan === "TRIAL") {
      await usageRepository.increment(hostUserId, USAGE_KIND.TRANSCRIPT_LIFETIME);
    }

    return "queued";
  },

  planGateError,
};
