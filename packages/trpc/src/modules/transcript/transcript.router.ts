import type { TRPCRouterRecord } from "@trpc/server";

import { z } from "zod";

import { protectedProcedure } from "../../trpc";
import { transcriptService } from "./transcript.service";

export const transcriptRouter = {
  getSegments: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getSegments(input.sessionId)),

  getChapters: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getChapters(input.sessionId)),

  getShowNotes: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => transcriptService.getShowNotes(input.sessionId)),
} satisfies TRPCRouterRecord;
