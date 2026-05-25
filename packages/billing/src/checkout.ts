import { prisma } from "@ototabi/store";

import { dodoPayments, isDodoConfigured } from "./index";

const TRIAL_DAYS = 14;

export async function createCheckoutLink(params: {
  userId: string;
  userEmail: string;
  plan: "creator" | "pro" | "studio";
  successUrl: string;
}): Promise<string | null> {
  if (!isDodoConfigured()) {
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
  if (!productId) throw new Error(`No Dodo product for plan: ${params.plan}`);

  const session = await dodoPayments.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email: params.userEmail },
    return_url: params.successUrl,
    metadata: { userId: params.userId, plan: params.plan },
  });

  return session.checkout_url ?? null;
}

const PLAN_PRODUCT_IDS: Record<string, string> = {
  creator: process.env.DODO_PRODUCT_CREATOR || "",
  pro: process.env.DODO_PRODUCT_PRO || "",
  studio: process.env.DODO_PRODUCT_STUDIO || "",
};
