import { hostProcedure } from "../../trpc";
import {
  getDemoSessionSchema,
  saveDemoEditSchema,
  startDemoSessionSchema,
  stopDemoSessionSchema,
} from "./demo.dto";
import { demoService } from "./demo.service";

export const demoRouter = {
  startSession: hostProcedure
    .input(startDemoSessionSchema)
    .mutation(({ ctx }) => demoService.startDemoSession({ actorId: ctx.session.user.id })),

  stopSession: hostProcedure.input(stopDemoSessionSchema).mutation(({ input, ctx }) =>
    demoService.stopDemoSession({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      cursorEvents: input.cursorEvents,
    }),
  ),

  getSession: hostProcedure.input(getDemoSessionSchema).query(({ input, ctx }) =>
    demoService.getDemoSession({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  saveEdit: hostProcedure.input(saveDemoEditSchema).mutation(({ input, ctx }) =>
    demoService.saveDemoEdit({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      zoomRegions: input.zoomRegions,
      trimStartMs: input.trimStartMs,
      trimEndMs: input.trimEndMs,
      background: input.background,
    }),
  ),
};
