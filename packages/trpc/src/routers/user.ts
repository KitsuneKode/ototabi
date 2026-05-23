import type { TRPCRouterRecord } from "@trpc/server";

import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const userRouter = {
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: { id: true, name: true, email: true, image: true },
      });
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.user.delete({ where: { id: ctx.session.user.id } });
    return { success: true };
  }),
} satisfies TRPCRouterRecord;
