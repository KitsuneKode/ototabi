import type { TRPCRouterRecord } from "@trpc/server";

import { hostProcedure } from "../../trpc";
import { roomIdInputSchema, sessionIdInputSchema } from "./recordings.dto";
import { recordingsService } from "./recordings.service";

export const recordingsRouter = {
  startRecordingSession: hostProcedure.input(roomIdInputSchema).mutation(({ input, ctx }) =>
    recordingsService.startRecordingSession({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
    }),
  ),

  stopRecordingSession: hostProcedure.input(sessionIdInputSchema).mutation(({ input, ctx }) =>
    recordingsService.stopRecordingSession({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  getRecordingSessions: hostProcedure
    .input(roomIdInputSchema)
    .query(({ input }) => recordingsService.getRecordingSessions(input.roomId)),

  getRecordingSessionById: hostProcedure
    .input(sessionIdInputSchema)
    .query(({ input }) => recordingsService.getRecordingSessionById(input.sessionId)),

  listRecentSessions: hostProcedure.query(({ ctx }) =>
    recordingsService.listRecentSessions(ctx.session.user.id),
  ),
} satisfies TRPCRouterRecord;
