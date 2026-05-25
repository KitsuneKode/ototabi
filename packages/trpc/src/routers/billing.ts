import type { TRPCRouterRecord } from "@trpc/server";

import { createCheckoutLink } from "@ototabi/billing/checkout";
import { prisma } from "@ototabi/store";
import { z } from "zod";

import { memberProcedure } from "../trpc";

export const billingRouter = {
  getSubscription: memberProcedure.query(async ({ ctx }) => {
    return prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  checkout: memberProcedure
    .input(z.object({ plan: z.enum(["creator", "pro", "studio"]), successUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const url = await createCheckoutLink({
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        plan: input.plan,
        successUrl: input.successUrl,
      });
      return { url };
    }),
} satisfies TRPCRouterRecord;
