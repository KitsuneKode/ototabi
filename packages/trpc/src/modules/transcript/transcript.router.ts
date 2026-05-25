import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { memberProcedure } from "../../trpc";
import { transcriptService } from "./transcript.service";

export const transcriptRouter = {
  getSegments: memberProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getSegments(input.sessionId)),

  getChapters: memberProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getChapters(input.sessionId)),

  getShowNotes: memberProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getShowNotes(input.sessionId)),
} satisfies TRPCRouterRecord;
