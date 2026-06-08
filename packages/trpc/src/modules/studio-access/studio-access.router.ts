import type { TRPCRouterRecord } from "@trpc/server";

import { hostProcedure, protectedProcedure, publicProcedure } from "../../trpc";
import {
  createInviteInputSchema,
  joinRoomInputSchema,
  listJoinRequestsInputSchema,
  roomIdInputSchema,
  roomIdInviteIdInputSchema,
  roomIdTargetUserInputSchema,
  validateInviteInputSchema,
} from "./studio-access.dto";
import { studioAccessService } from "./studio-access.service";

export const studioAccessRouter = {
  createInvite: hostProcedure.input(createInviteInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.createInvite({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      role: input.role,
      email: input.email,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt,
    }),
  ),

  listInvites: hostProcedure
    .input(roomIdInputSchema)
    .query(({ input, ctx }) =>
      studioAccessService.listInvites({ actorId: ctx.session.user.id, roomId: input.roomId }),
    ),

  revokeInvite: hostProcedure.input(roomIdInviteIdInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.revokeInvite({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      inviteId: input.inviteId,
    }),
  ),

  validateInvite: publicProcedure
    .input(validateInviteInputSchema)
    .query(({ input }) => studioAccessService.validateInvite(input)),

  joinRoom: protectedProcedure.input(joinRoomInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.joinRoom({
      userId: ctx.session.user.id,
      code: input.code,
      inviteToken: input.inviteToken,
    }),
  ),

  lockRoom: hostProcedure
    .input(roomIdInputSchema)
    .mutation(({ input, ctx }) =>
      studioAccessService.lockRoom({ actorId: ctx.session.user.id, roomId: input.roomId }),
    ),

  unlockRoom: hostProcedure
    .input(roomIdInputSchema)
    .mutation(({ input, ctx }) =>
      studioAccessService.unlockRoom({ actorId: ctx.session.user.id, roomId: input.roomId }),
    ),

  listJoinRequests: hostProcedure.input(listJoinRequestsInputSchema).query(({ input, ctx }) =>
    studioAccessService.listJoinRequests({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      status: input.status,
    }),
  ),

  admitJoinRequest: hostProcedure.input(roomIdTargetUserInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.admitJoinRequest({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      targetUserId: input.targetUserId,
    }),
  ),

  denyJoinRequest: hostProcedure.input(roomIdTargetUserInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.denyJoinRequest({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      targetUserId: input.targetUserId,
    }),
  ),

  leaveRoom: protectedProcedure
    .input(roomIdInputSchema)
    .mutation(({ input, ctx }) =>
      studioAccessService.leaveRoom({ userId: ctx.session.user.id, roomId: input.roomId }),
    ),

  getRoomParticipants: protectedProcedure
    .input(roomIdInputSchema)
    .query(({ input }) => studioAccessService.getRoomParticipants(input.roomId)),

  getStudioContext: protectedProcedure
    .input(roomIdInputSchema)
    .query(({ input, ctx }) =>
      studioAccessService.getStudioContext({ userId: ctx.session.user.id, roomId: input.roomId }),
    ),

  getStudioHealth: protectedProcedure
    .input(roomIdInputSchema)
    .query(({ input, ctx }) =>
      studioAccessService.getStudioHealth({ userId: ctx.session.user.id, roomId: input.roomId }),
    ),

  acknowledgeRecordingConsent: protectedProcedure
    .input(roomIdInputSchema)
    .mutation(({ input, ctx }) =>
      studioAccessService.acknowledgeRecordingConsent({
        userId: ctx.session.user.id,
        roomId: input.roomId,
      }),
    ),

  removeGuest: hostProcedure.input(roomIdTargetUserInputSchema).mutation(({ input, ctx }) =>
    studioAccessService.removeGuest({
      actorId: ctx.session.user.id,
      roomId: input.roomId,
      targetUserId: input.targetUserId,
    }),
  ),

  requestParticipantMute: hostProcedure
    .input(roomIdTargetUserInputSchema)
    .mutation(({ input, ctx }) =>
      studioAccessService.requestParticipantMute({
        actorId: ctx.session.user.id,
        roomId: input.roomId,
        targetUserId: input.targetUserId,
      }),
    ),
} satisfies TRPCRouterRecord;
