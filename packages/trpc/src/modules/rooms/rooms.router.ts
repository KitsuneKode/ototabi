import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { protectedProcedure } from "../../trpc";
import { roomsService } from "./rooms.service";

export const roomsRouter = {
  createRoom: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ input, ctx }) =>
      roomsService.createRoom({ userId: ctx.session.user.id, name: input.name }),
    ),

  updateRoom: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).optional() }))
    .mutation(({ input, ctx }) =>
      roomsService.updateRoom({ userId: ctx.session.user.id, roomId: input.id, name: input.name }),
    ),

  deleteRoom: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.deleteRoom({ userId: ctx.session.user.id, roomId: input.id }),
    ),

  getRoom: protectedProcedure
    .input(z.object({ id: z.string().optional(), code: z.string().optional() }))
    .query(({ input }) => roomsService.getRoom(input)),

  listRooms: protectedProcedure.query(({ ctx }) => roomsService.listRooms(ctx.session.user.id)),

  joinRoom: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.joinRoom({ userId: ctx.session.user.id, code: input.code }),
    ),

  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.leaveRoom({ userId: ctx.session.user.id, roomId: input.roomId }),
    ),

  getRoomParticipants: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => roomsService.getRoomParticipants(input.roomId)),

  startRecordingSession: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input }) => roomsService.startRecordingSession(input.roomId)),

  stopRecordingSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => roomsService.stopRecordingSession(input.sessionId)),

  getRecordingSessions: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => roomsService.getRecordingSessions(input.roomId)),

  getRecordingSessionById: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => roomsService.getRecordingSessionById(input.sessionId)),

  listRecentSessions: protectedProcedure.query(({ ctx }) =>
    roomsService.listRecentSessions(ctx.session.user.id),
  ),
} satisfies TRPCRouterRecord;
