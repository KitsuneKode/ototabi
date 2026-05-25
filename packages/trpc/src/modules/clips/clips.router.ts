import { z } from "zod/v4";

import { creatorProcedure, memberProcedure } from "../../trpc";
import { clipsService } from "./clips.service";

export const clipsRouter = {
  listBySession: memberProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input, ctx }) =>
      clipsService.listForSession({ actorId: ctx.session.user.id, sessionId: input.sessionId }),
    ),

  queueVerticalRender: creatorProcedure
    .input(z.object({ sessionId: z.string(), clipId: z.string() }))
    .mutation(({ input, ctx }) =>
      clipsService.queueClipRender({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
        clipId: input.clipId,
      }),
    ),

  listReelsPresets: memberProcedure.query(() => clipsService.listReelsPresets()),

  queueReelsRender: creatorProcedure
    .input(
      z.object({
        sessionId: z.string(),
        clipId: z.string(),
        reelsPresetId: z.string(),
      }),
    )
    .mutation(({ input, ctx }) =>
      clipsService.queueReelsRender({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
        clipId: input.clipId,
        reelsPresetId: input.reelsPresetId,
      }),
    ),

  regenerate: creatorProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input, ctx }) =>
      clipsService.regenerateClips({
        actorId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),
};
