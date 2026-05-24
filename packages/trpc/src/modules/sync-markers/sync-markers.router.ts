import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../../trpc";
import { listSyncMarkersSchema, submitSyncMarkerSchema } from "./sync-markers.dto";
import { syncMarkersService } from "./sync-markers.service";

export const syncMarkersRouter = {
  submit: protectedProcedure.input(submitSyncMarkerSchema).mutation(({ input, ctx }) =>
    syncMarkersService.submit({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      localTime: input.localTime,
      rtpTimestamp: input.rtpTimestamp,
      trackSid: input.trackSid,
    }),
  ),

  listBySession: protectedProcedure.input(listSyncMarkersSchema).query(({ input, ctx }) =>
    syncMarkersService.list({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),
} satisfies TRPCRouterRecord;
