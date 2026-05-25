import type { TRPCRouterRecord } from "@trpc/server";

import { memberProcedure } from "../../trpc";
import { usageService } from "./usage.service";

export const usageRouter = {
  get: memberProcedure.query(({ ctx }) => usageService.getSnapshot(ctx.session.user.id)),
} satisfies TRPCRouterRecord;
