import { prisma } from "@ototabi/store";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

function generateRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 3; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${part1}-${part2}`;
}

export const roomsRouter = {
  createRoom: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      let code = generateRoomCode();
      for (let attempts = 0; attempts < 10; attempts++) {
        const existing = await prisma.room.findUnique({ where: { code } });
        if (!existing) break;
        code = generateRoomCode();
      }
      return prisma.room.create({
        data: { name, code, creatorId: ctx.session.user.id },
      });
    }),

  updateRoom: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).optional() }))
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.room.findUnique({ where: { id: input.id } });
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      if (room.creatorId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can update this room" });
      return prisma.room.update({
        where: { id: input.id },
        data: { ...(input.name && { name: input.name }) },
      });
    }),

  deleteRoom: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.room.findUnique({ where: { id: input.id } });
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      if (room.creatorId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can delete this room" });
      await prisma.room.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getRoom: protectedProcedure
    .input(z.object({ id: z.string().optional(), code: z.string().optional() }))
    .query(async ({ input }) => {
      const { id, code } = input;
      if (!id && !code)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide room id or code" });
      const room = await prisma.room.findFirst({
        where: id ? { id } : { code },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { participants: true } },
        },
      });
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      return room;
    }),

  listRooms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return prisma.room.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { sessions: true, participants: true } },
      },
    });
  }),

  joinRoom: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await prisma.room.findUnique({ where: { code: input.code } });
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      const existing = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: ctx.session.user.id } },
      });
      if (existing) return room;
      await prisma.roomParticipant.create({
        data: { roomId: room.id, userId: ctx.session.user.id },
      });
      return room;
    }),

  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.roomParticipant.deleteMany({
        where: { roomId: input.roomId, userId: ctx.session.user.id },
      });
      return { success: true };
    }),

  getRoomParticipants: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input }) => {
      return prisma.roomParticipant.findMany({
        where: { roomId: input.roomId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
    }),

  startRecordingSession: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({ where: { id: input.roomId } });
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      await prisma.recordingSession.updateMany({
        where: { roomId: input.roomId, status: "RECORDING" },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
      return prisma.recordingSession.create({
        data: { roomId: input.roomId, status: "RECORDING", startedAt: new Date() },
      });
    }),

  stopRecordingSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const session = await prisma.recordingSession.findUnique({
        where: { id: input.sessionId },
      });
      if (!session)
        throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
      return prisma.recordingSession.update({
        where: { id: input.sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
    }),

  getRecordingSessions: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input }) => {
      const { roomId } = input;
      return prisma.recordingSession.findMany({
        where: { roomId },
        orderBy: { startedAt: "desc" },
        include: {
          tracks: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  getRecordingSessionById: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await prisma.recordingSession.findUnique({
        where: { id: input.sessionId },
        include: {
          room: { select: { id: true, name: true, code: true } },
          tracks: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!session)
        throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
      return session;
    }),

  listRecentSessions: protectedProcedure.query(async ({ ctx }) => {
    return prisma.recordingSession.findMany({
      where: {
        room: { creatorId: ctx.session.user.id },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        room: { select: { id: true, name: true, code: true } },
        tracks: { select: { id: true, status: true, type: true } },
      },
    });
  }),
} satisfies TRPCRouterRecord;
