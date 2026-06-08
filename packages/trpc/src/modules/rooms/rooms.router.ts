import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { hostProcedure, protectedProcedure, publicProcedure } from "../../trpc";
import { roomsService } from "./rooms.service";

export const roomsRouter = {
  createRoom: hostProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ input, ctx }) =>
      roomsService.createRoom({ userId: ctx.session.user.id, name: input.name }),
    ),

  updateRoom: hostProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).optional() }))
    .mutation(({ input, ctx }) =>
      roomsService.updateRoom({ userId: ctx.session.user.id, roomId: input.id, name: input.name }),
    ),

  deleteRoom: hostProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.deleteRoom({ userId: ctx.session.user.id, roomId: input.id }),
    ),

  getRoom: protectedProcedure
    .input(z.object({ id: z.string().optional(), code: z.string().optional() }))
    .query(({ input }) => roomsService.getRoom(input)),

  getRoomByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => roomsService.getRoom({ code: input.code })),

  listRooms: hostProcedure.query(({ ctx }) => roomsService.listRooms(ctx.session.user.id)),

  listSharedRooms: hostProcedure.query(({ ctx }) =>
    roomsService.listSharedRooms(ctx.session.user.id),
  ),

  inviteMember: hostProcedure
    .input(z.object({ roomId: z.string(), email: z.string().email(), role: z.string().optional() }))
    .mutation(({ input, ctx }) =>
      roomsService.inviteMember({
        actorId: ctx.session.user.id,
        roomId: input.roomId,
        email: input.email,
        role: input.role,
      }),
    ),

  removeMember: hostProcedure
    .input(z.object({ roomId: z.string(), targetUserId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.removeMember({
        actorId: ctx.session.user.id,
        roomId: input.roomId,
        targetUserId: input.targetUserId,
      }),
    ),

  getRoomMembers: hostProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => roomsService.getRoomMembers(input.roomId)),
} satisfies TRPCRouterRecord;
