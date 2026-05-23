import { prisma } from "@ototabi/store";

export async function handlePolarWebhook(event: any): Promise<void> {
  switch (event.type) {
    case "subscription.active": {
      const sub = event.data;
      const userId = sub.metadata?.userId as string | undefined;
      if (!userId) return;
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: ((sub.metadata?.plan as string) || "CREATOR").toUpperCase() as any,
          status: "ACTIVE",
          stripeCustomerId: sub.customerId,
          trialEndsAt: null,
          currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
        },
        update: {
          status: "ACTIVE",
          currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
        },
      });
      break;
    }
    case "subscription.canceled": {
      const sub = event.data;
      const userId = sub.metadata?.userId as string | undefined;
      if (!userId) return;
      await prisma.subscription.updateMany({
        where: { userId },
        data: { status: "CANCELED" },
      });
      break;
    }
    case "subscription.revoked": {
      const sub = event.data;
      const userId = sub.metadata?.userId as string | undefined;
      if (!userId) return;
      await prisma.subscription.updateMany({
        where: { userId },
        data: { status: "EXPIRED", plan: "TRIAL" },
      });
      break;
    }
  }
}
