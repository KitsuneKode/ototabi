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

  createInvite: hostProcedure
    .input(
      z.object({
        roomId: z.string(),
        role: z.enum(["participant", "editor", "viewer"]).default("participant"),
        email: z.string().email().optional(),
        maxUses: z.number().int().positive().max(100).optional(),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      roomsService.createInvite({
        actorId: ctx.session.user.id,
        roomId: input.roomId,
        role: input.role,
        email: input.email,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      }),
    ),

  listInvites: hostProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input, ctx }) =>
      roomsService.listInvites({ actorId: ctx.session.user.id, roomId: input.roomId }),
    ),

  revokeInvite: hostProcedure
    .input(z.object({ roomId: z.string(), inviteId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.revokeInvite({
        actorId: ctx.session.user.id,
        roomId: input.roomId,
        inviteId: input.inviteId,
      }),
    ),

  validateInvite: publicProcedure
    .input(z.object({ code: z.string(), token: z.string() }))
    .query(({ input }) => roomsService.validateInvite(input)),

  joinRoom: protectedProcedure
    .input(z.object({ code: z.string(), inviteToken: z.string().optional() }))
    .mutation(({ input, ctx }) =>
      roomsService.joinRoom({
        userId: ctx.session.user.id,
        code: input.code,
        inviteToken: input.inviteToken,
      }),
    ),

  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.leaveRoom({ userId: ctx.session.user.id, roomId: input.roomId }),
    ),

  getRoomParticipants: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => roomsService.getRoomParticipants(input.roomId)),

  startRecordingSession: hostProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.startRecordingSession({ actorId: ctx.session.user.id, roomId: input.roomId }),
    ),

  stopRecordingSession: hostProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input, ctx }) =>
      roomsService.stopRecordingSession({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),

  getRecordingSessions: hostProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => roomsService.getRecordingSessions(input.roomId)),

  getRecordingSessionById: hostProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => roomsService.getRecordingSessionById(input.sessionId)),

  listRecentSessions: hostProcedure.query(({ ctx }) =>
    roomsService.listRecentSessions(ctx.session.user.id),
  ),
} satisfies TRPCRouterRecord;
