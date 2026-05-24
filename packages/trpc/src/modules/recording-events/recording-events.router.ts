import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { protectedProcedure } from "../../trpc";
import { createRecordingEventSchema } from "./recording-events.dto";
import { recordingEventsService } from "./recording-events.service";

export const recordingEventsRouter = {
  create: protectedProcedure.input(createRecordingEventSchema).mutation(({ input, ctx }) =>
    recordingEventsService.createEvent({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      type: input.type,
      trackSid: input.trackSid,
      message: input.message,
      metadata: input.metadata,
    }),
  ),

  listBySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input, ctx }) =>
      recordingEventsService.listEvents({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),
} satisfies TRPCRouterRecord;
