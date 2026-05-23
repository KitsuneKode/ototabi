import type { TRPCRouterRecord } from "@trpc/server";

import { prisma } from "@ototabi/store";
import { createCheckoutLink } from "billing/checkout";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const billingRouter = {
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  checkout: protectedProcedure
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
