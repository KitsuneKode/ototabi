import { z } from "zod/v4";

import { protectedProcedure } from "../../trpc";
import { clipsService } from "./clips.service";

export const clipsRouter = {
  listBySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input, ctx }) =>
      clipsService.listForSession({ actorId: ctx.session.user.id, sessionId: input.sessionId }),
    ),

  queueVerticalRender: protectedProcedure
    .input(z.object({ sessionId: z.string(), clipId: z.string() }))
    .mutation(({ input, ctx }) =>
      clipsService.queueClipRender({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
        clipId: input.clipId,
      }),
    ),

  regenerate: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input, ctx }) =>
      clipsService.regenerateClips({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),
};
