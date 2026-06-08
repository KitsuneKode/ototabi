import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";

import { recordingEventsService } from "../recording-events/recording-events.service";
import { recordingsRepository } from "../recordings/recordings.repository";
import { enterStudio, hashInviteToken, StudioAccessError } from "./enter-studio";
import { studioAccessPolicy } from "./studio-access.policy";
import { studioAccessRepository } from "./studio-access.repository";

function createInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export const studioAccessService = {
  async createInvite(params: {
    actorId: string;
    roomId: string;
    role: "participant" | "editor" | "viewer";
    email?: string;
    maxUses?: number;
    expiresAt?: Date;
  }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canControlStudio(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to create invites" });
    }

    const token = createInviteToken();
    const invite = await studioAccessRepository.createInvite({
      roomId: params.roomId,
      tokenHash: hashInviteToken(token),
      role: params.role,
      email: params.email,
      maxUses: params.maxUses,
      expiresAt: params.expiresAt,
      createdBy: params.actorId,
    });

    return { ...invite, token };
  },

  async listInvites(params: { actorId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canControlStudio(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view invites" });
    }
    return studioAccessRepository.listInvites(params.roomId);
  },

  async revokeInvite(params: { actorId: string; roomId: string; inviteId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canControlStudio(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to revoke invites" });
    }
    await studioAccessRepository.revokeInvite(params.inviteId);
    return { success: true };
  },

  async validateInvite(params: { code: string; token: string }) {
    const invite = await studioAccessRepository.findInviteByTokenHash(
      hashInviteToken(params.token),
    );
    if (!invite || invite.room.code !== params.code || !studioAccessPolicy.isInviteUsable(invite)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Invite is invalid or expired" });
    }
    return {
      roomId: invite.roomId,
      roomName: invite.room.name,
      role: invite.role,
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  },

  async joinRoom(params: { userId: string; code: string; inviteToken?: string }) {
    const hadInvite = !!params.inviteToken;
    let roomId: string;
    try {
      ({ roomId } = await enterStudio({
        userId: params.userId,
        roomCode: params.code,
        inviteToken: params.inviteToken,
      }));
    } catch (error) {
      if (error instanceof StudioAccessError) {
        throw new TRPCError({ code: error.code, message: error.message });
      }
      throw error;
    }

    const room = await studioAccessRepository.findUniqueCode(params.code);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

    const activeSession = await recordingsRepository.findActiveSessionByRoom(roomId);
    if (activeSession) {
      await recordingEventsService.createEvent({
        actorId: params.userId,
        sessionId: activeSession.id,
        type: "JOIN",
        message: hadInvite ? "Participant joined studio with invite" : "Participant joined studio",
      });
    }

    return room;
  },

  async lockRoom(params: { actorId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canToggleRoomLock(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to lock this room" });
    }
    return studioAccessRepository.setRoomLocked(params.roomId, true);
  },

  async unlockRoom(params: { actorId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canToggleRoomLock(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to unlock this room" });
    }
    return studioAccessRepository.setRoomLocked(params.roomId, false);
  },

  async listJoinRequests(params: { actorId: string; roomId: string; status?: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view join requests" });
    }
    return studioAccessRepository.listJoinRequests(params.roomId, params.status);
  },

  async admitJoinRequest(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to admit guests" });
    }
    return studioAccessRepository.upsertJoinRequest({
      roomId: params.roomId,
      userId: params.targetUserId,
      status: "admitted",
    });
  },

  async denyJoinRequest(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to deny guests" });
    }
    return studioAccessRepository.upsertJoinRequest({
      roomId: params.roomId,
      userId: params.targetUserId,
      status: "denied",
    });
  },

  async leaveRoom(params: { userId: string; roomId: string }) {
    const activeSession = await recordingsRepository.findActiveSessionByRoom(params.roomId);
    await studioAccessRepository.removeParticipant(params.roomId, params.userId);
    if (activeSession) {
      await recordingEventsService.createEvent({
        sessionId: activeSession.id,
        type: "LEAVE",
        message: "Participant left studio",
        metadata: { userId: params.userId },
      });
    }
    return { success: true };
  },

  async getRoomParticipants(roomId: string) {
    return studioAccessRepository.listParticipants(roomId);
  },

  async getStudioContext(params: { userId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const member = await studioAccessRepository.findMember(params.roomId, params.userId);
    const recordingConsentedAt = await studioAccessRepository.getRecordingConsent(
      params.roomId,
      params.userId,
    );
    return {
      canControlStudio: studioAccessPolicy.canControlStudio(member, room, params.userId),
      memberRole: member?.role ?? (room.creatorId === params.userId ? "creator" : null),
      recordingConsentedAt,
      hasRecordingConsent: !!recordingConsentedAt,
    };
  },

  async getStudioHealth(params: { userId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const { member, participant } = await studioAccessRepository.findAccessContext(
      params.roomId,
      params.userId,
    );
    if (
      !studioAccessPolicy.canJoinRoom({
        room,
        userId: params.userId,
        member,
        participant,
        inviteUsable: false,
      })
    ) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized in this room" });
    }

    const rows = await studioAccessRepository.listParticipants(params.roomId);
    return {
      participants: rows.map((row) => ({
        userId: row.userId,
        name: row.user.name,
        email: row.user.email,
        hasRecordingConsent: !!row.recordingConsentedAt,
        recordingConsentedAt: row.recordingConsentedAt,
      })),
    };
  },

  async acknowledgeRecordingConsent(params: { userId: string; roomId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const { member, participant } = await studioAccessRepository.findAccessContext(
      params.roomId,
      params.userId,
    );
    if (
      !studioAccessPolicy.canJoinRoom({
        room,
        userId: params.userId,
        member,
        participant,
        inviteUsable: false,
      })
    ) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized in this room" });
    }
    const consentedAt = new Date();
    await studioAccessRepository.setRecordingConsent(params.roomId, params.userId, consentedAt);
    return { recordingConsentedAt: consentedAt };
  },

  async removeGuest(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (params.targetUserId === room.creatorId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove the room creator" });
    }
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canRemoveGuest(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to remove guests" });
    }
    const target = await studioAccessRepository.findParticipant(params.roomId, params.targetUserId);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Guest not in room" });
    await studioAccessRepository.removeParticipant(params.roomId, params.targetUserId);
    const activeSession = await recordingsRepository.findActiveSessionByRoom(params.roomId);
    if (activeSession) {
      await recordingEventsService.createEvent({
        actorId: params.actorId,
        sessionId: activeSession.id,
        type: "LEAVE",
        message: "Guest removed by host",
        metadata: { userId: params.targetUserId, removedByHost: true },
      });
    }
    return { success: true };
  },

  async requestParticipantMute(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await studioAccessRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await studioAccessRepository.findMember(params.roomId, params.actorId);
    if (!studioAccessPolicy.canRequestMute(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to request mute" });
    }
    if (params.targetUserId === params.actorId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot mute yourself via host request",
      });
    }
    const target = await studioAccessRepository.findParticipant(params.roomId, params.targetUserId);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Guest not in room" });
    return { success: true, targetUserId: params.targetUserId };
  },
};
