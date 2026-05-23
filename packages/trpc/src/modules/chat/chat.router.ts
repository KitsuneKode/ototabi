import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { protectedProcedure } from "../../trpc";
import { chatService } from "./chat.service";

export const chatRouter = {
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(({ input, ctx }) =>
      chatService.sendMessage({
        userId: ctx.session.user.id,
        roomId: input.roomId,
        message: input.message,
      }),
    ),

  getMessages: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(({ input }) => chatService.getMessages(input)),
} satisfies TRPCRouterRecord;
