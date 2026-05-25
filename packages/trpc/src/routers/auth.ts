import type { TRPCRouterRecord } from "@trpc/server";

import { memberProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) return null;
    const dbUser = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { role: true },
    });
    return {
      user: {
        id: ctx.session.user.id,
        name: ctx.session.user.name,
        email: ctx.session.user.email,
        image: ctx.session.user.image,
        role: dbUser?.role ?? "user",
      },
    };
  }),
  getSecretMessage: memberProcedure.query(() => {
    return "you can see this secret message!";
  }),
} satisfies TRPCRouterRecord;
