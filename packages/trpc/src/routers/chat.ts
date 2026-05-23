import type { TRPCRouterRecord } from "@trpc/server";

import { prisma } from "@ototabi/store";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

export const chatRouter = {
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.chatMessage.create({
        data: {
          roomId: input.roomId,
          userId: ctx.session.user.id,
          message: input.message,
        },
      });
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return prisma.chatMessage.findMany({
        where: { roomId: input.roomId },
        orderBy: { createdAt: "asc" },
        take: input.limit,
        include: {
          user: { select: { id: true, name: true } },
        },
      });
    }),
} satisfies TRPCRouterRecord;
