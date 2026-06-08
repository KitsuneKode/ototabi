import { z } from "zod";

export const createInviteInputSchema = z.object({
  roomId: z.string(),
  role: z.enum(["participant", "editor", "viewer"]).default("participant"),
  email: z.string().email().optional(),
  maxUses: z.number().int().positive().max(100).optional(),
  expiresAt: z.date().optional(),
});

export const roomIdInputSchema = z.object({ roomId: z.string() });

export const roomIdInviteIdInputSchema = z.object({
  roomId: z.string(),
  inviteId: z.string(),
});

export const validateInviteInputSchema = z.object({
  code: z.string(),
  token: z.string(),
});

export const joinRoomInputSchema = z.object({
  code: z.string(),
  inviteToken: z.string().optional(),
});

export const listJoinRequestsInputSchema = z.object({
  roomId: z.string(),
  status: z.enum(["pending", "admitted", "denied"]).optional(),
});

export const roomIdTargetUserInputSchema = z.object({
  roomId: z.string(),
  targetUserId: z.string(),
});
