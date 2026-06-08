import { z } from "zod";

export const roomIdInputSchema = z.object({ roomId: z.string() });
export const sessionIdInputSchema = z.object({ sessionId: z.string() });
