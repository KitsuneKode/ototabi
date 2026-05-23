import { prisma } from "@ototabi/store";

import { polar, isPolarConfigured } from "./index";

const TRIAL_DAYS = 14;

export async function createCheckoutLink(params: {
  userId: string;
  userEmail: string;
  plan: "creator" | "pro" | "studio";
  successUrl: string;
}): Promise<string | null> {
  if (!isPolarConfigured()) {
    // Fallback: activate trial
    await prisma.subscription.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        plan: "TRIAL",
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      },
      update: { plan: "TRIAL", status: "TRIALING" },
    });
    return params.successUrl;
  }

  const productId = PLAN_PRODUCT_IDS[params.plan];
  if (!productId) throw new Error(`No Polar product for plan: ${params.plan}`);

  const result = await polar.checkouts.create({
    products: [productId],
    successUrl: params.successUrl,
    customerEmail: params.userEmail,
    metadata: { userId: params.userId, plan: params.plan },
  } as any);

  return result.url;
}

const PLAN_PRODUCT_IDS: Record<string, string> = {
  creator: process.env.POLAR_PRODUCT_CREATOR || "",
  pro: process.env.POLAR_PRODUCT_PRO || "",
  studio: process.env.POLAR_PRODUCT_STUDIO || "",
};
