import type { Plan, SubscriptionStatus } from "@ototabi/store";

import { prisma } from "@ototabi/store";

type DodoWebhookEvent = {
  type: string;
  data?: {
    metadata?: Record<string, unknown>;
    customer_id?: string;
    customer?: { customer_id?: string };
    current_period_end?: string;
    next_billing_date?: string;
    expires_at?: string;
  };
};

function planFromMetadata(metadata: Record<string, unknown> | undefined): Plan {
  const raw = typeof metadata?.plan === "string" ? metadata.plan : "creator";
  return raw.toUpperCase() as Plan;
}

function customerIdFromData(data: DodoWebhookEvent["data"]): string | undefined {
  return data?.customer_id ?? data?.customer?.customer_id;
}

function periodEndFromData(data: DodoWebhookEvent["data"]): Date | null {
  const raw = data?.current_period_end ?? data?.next_billing_date ?? data?.expires_at;
  return raw ? new Date(raw) : null;
}

export async function handleDodoWebhook(event: DodoWebhookEvent): Promise<void> {
  const data = event.data;
  const userId = typeof data?.metadata?.userId === "string" ? data.metadata.userId : undefined;
  if (!userId) return;

  const customerId = customerIdFromData(data);
  const currentPeriodEnd = periodEndFromData(data);
  const plan = planFromMetadata(data?.metadata);

  switch (event.type) {
    case "subscription.active":
    case "subscription.renewed":
    case "subscription.plan_changed": {
      await upsertActiveSubscription({
        userId,
        plan,
        customerId,
        currentPeriodEnd,
        status: "ACTIVE",
      });
      break;
    }
    case "subscription.on_hold":
    case "subscription.failed": {
      await prisma.subscription.updateMany({
        where: { userId },
        data: {
          status: "PAST_DUE",
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        },
      });
      break;
    }
    case "subscription.cancelled": {
      await prisma.subscription.updateMany({
        where: { userId },
        data: { status: "CANCELED" },
      });
      break;
    }
    case "subscription.expired": {
      await prisma.subscription.updateMany({
        where: { userId },
        data: { status: "EXPIRED", plan: "TRIAL" },
      });
      break;
    }
  }
}

async function upsertActiveSubscription(params: {
  userId: string;
  plan: Plan;
  customerId?: string;
  currentPeriodEnd: Date | null;
  status: SubscriptionStatus;
}): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      plan: params.plan,
      status: params.status,
      stripeCustomerId: params.customerId ?? null,
      trialEndsAt: null,
      currentPeriodEnd: params.currentPeriodEnd,
    },
    update: {
      plan: params.plan,
      status: params.status,
      ...(params.customerId ? { stripeCustomerId: params.customerId } : {}),
      trialEndsAt: null,
      ...(params.currentPeriodEnd ? { currentPeriodEnd: params.currentPeriodEnd } : {}),
    },
  });
}
