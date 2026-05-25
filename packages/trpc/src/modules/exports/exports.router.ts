import type { TRPCRouterRecord } from "@trpc/server";

import { hostProcedure } from "../../trpc";
import { createExportBundleSchema, listExportableAssetsSchema } from "./exports.dto";
import { exportsService } from "./exports.service";

export const exportsRouter = {
  listExportableAssets: hostProcedure.input(listExportableAssetsSchema).query(({ input, ctx }) =>
    exportsService.listExportableAssets({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
    }),
  ),

  createExportBundle: hostProcedure.input(createExportBundleSchema).mutation(({ input, ctx }) =>
    exportsService.createExportBundle({
      actorId: ctx.session.user.id,
      sessionId: input.sessionId,
      assetIds: input.assetIds,
      asZip: input.asZip,
    }),
  ),
} satisfies TRPCRouterRecord;
