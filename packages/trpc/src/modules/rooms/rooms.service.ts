import { transcriptJobId } from "@ototabi/common/pipeline-status";
import { getTranscriptQueue } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";

import { recordingEventsService } from "../recording-events/recording-events.service";
import {
  defaultLobbyInviteExpiresAt,
  DEFAULT_LOBBY_MAX_USES,
  enterStudio,
  hashInviteToken,
  StudioAccessError,
} from "./enter-studio";
import { roomsPolicy } from "./rooms.policy";
import { roomsRepository } from "./rooms.repository";

function createInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export const roomsService = {
  async createRoom(params: { userId: string; name: string }) {
    const code = await roomsRepository.generateUniqueCode();
    const room = await roomsRepository.create({
      name: params.name,
      code,
      creatorId: params.userId,
    });

    const lobbyToken = createInviteToken();
    await roomsRepository.createInvite({
      roomId: room.id,
      tokenHash: hashInviteToken(lobbyToken),
      role: "participant",
      createdBy: params.userId,
      maxUses: DEFAULT_LOBBY_MAX_USES,
      expiresAt: defaultLobbyInviteExpiresAt(),
      email: undefined,
    });

    return { ...room, lobbyInviteToken: lobbyToken };
  },

  async updateRoom(params: { userId: string; roomId: string; name?: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (!roomsPolicy.canUpdateRoom(room, params.userId))
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can update this room" });
    return roomsRepository.update(params.roomId, { name: params.name });
  },

  async deleteRoom(params: { userId: string; roomId: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (!roomsPolicy.canDeleteRoom(room, params.userId))
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can delete this room" });
    await roomsRepository.delete(params.roomId);
    return { success: true };
  },

  async getRoom(params: { id?: string; code?: string }) {
    if (!params.id && !params.code)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Provide room id or code" });
    const room = params.id
      ? await roomsRepository.findByIdWithRelations(params.id)
      : await roomsRepository.findByCodeWithRelations(params.code!);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    return room;
  },

  async listRooms(userId: string) {
    return roomsRepository.listByCreator(userId);
  },

  async listSharedRooms(userId: string) {
    return roomsRepository.listRoomsByMember(userId);
  },

  async inviteMember(params: { actorId: string; roomId: string; email: string; role?: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canInviteMember(actorMember, room, params.actorId))
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to invite members" });

    const targetUser = await prisma.user.findUnique({ where: { email: params.email } });
    if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    const existing = await roomsRepository.findMember(params.roomId, targetUser.id);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "User is already a member" });

    return roomsRepository.addMember({
      roomId: params.roomId,
      userId: targetUser.id,
      role: params.role || "editor",
      invitedBy: params.actorId,
    });
  },

  async removeMember(params: { actorId: string; roomId: string; targetUserId: string }) {
    const targetMember = await roomsRepository.findMember(params.roomId, params.targetUserId);
    if (!targetMember) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });

    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canRemoveMember(actorMember?.role, targetMember.role))
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to remove this member" });

    await roomsRepository.removeMember(params.roomId, params.targetUserId);
    return { success: true };
  },

  async getRoomMembers(roomId: string) {
    return roomsRepository.listMembers(roomId);
  },

  async createInvite(params: {
    actorId: string;
    roomId: string;
    role: "participant" | "editor" | "viewer";
    email?: string;
    maxUses?: number;
    expiresAt?: Date;
  }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canInviteMember(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to create invites" });
    }

    const token = createInviteToken();
    const invite = await roomsRepository.createInvite({
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
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canInviteMember(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view invites" });
    }
    return roomsRepository.listInvites(params.roomId);
  },

  async revokeInvite(params: { actorId: string; roomId: string; inviteId: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canInviteMember(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to revoke invites" });
    }
    await roomsRepository.revokeInvite(params.inviteId);
    return { success: true };
  },

  async validateInvite(params: { code: string; token: string }) {
    const invite = await roomsRepository.findInviteByTokenHash(hashInviteToken(params.token));
    if (!invite || invite.room.code !== params.code || !roomsPolicy.isInviteUsable(invite)) {
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
    } catch (err) {
      if (err instanceof StudioAccessError) {
        throw new TRPCError({ code: err.code, message: err.message });
      }
      throw err;
    }

    const room = await roomsRepository.findUniqueCode(params.code);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });

    const activeSession = await roomsRepository.findActiveSessionByRoom(roomId);
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
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (!roomsPolicy.canToggleRoomLock(room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can lock this room" });
    }
    return roomsRepository.setRoomLocked(params.roomId, true);
  },

  async unlockRoom(params: { actorId: string; roomId: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (!roomsPolicy.canToggleRoomLock(room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can unlock this room" });
    }
    return roomsRepository.setRoomLocked(params.roomId, false);
  },

  async listJoinRequests(params: { actorId: string; roomId: string; status?: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view join requests" });
    }
    return roomsRepository.listJoinRequests(params.roomId, params.status);
  },

  async admitJoinRequest(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to admit guests" });
    }
    return roomsRepository.upsertJoinRequest({
      roomId: params.roomId,
      userId: params.targetUserId,
      status: "admitted",
    });
  },

  async denyJoinRequest(params: { actorId: string; roomId: string; targetUserId: string }) {
    const room = await roomsRepository.findById(params.roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const actorMember = await roomsRepository.findMember(params.roomId, params.actorId);
    if (!roomsPolicy.canManageJoinRequests(actorMember, room, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to deny guests" });
    }
    return roomsRepository.upsertJoinRequest({
      roomId: params.roomId,
      userId: params.targetUserId,
      status: "denied",
    });
  },

  async leaveRoom(params: { userId: string; roomId: string }) {
    const activeSession = await roomsRepository.findActiveSessionByRoom(params.roomId);
    await roomsRepository.removeParticipant(params.roomId, params.userId);
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
    return roomsRepository.listParticipants(roomId);
  },

  async startRecordingSession(params: { actorId: string; roomId: string }) {
    const { room, member, participant } = await roomsRepository.findAccessContext(
      params.roomId,
      params.actorId,
    );
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    if (
      !roomsPolicy.canJoinRoom({
        room,
        userId: params.actorId,
        member,
        participant,
        inviteUsable: false,
      })
    ) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to start recording" });
    }

    await roomsRepository.endActiveSessions(params.roomId);
    const session = await roomsRepository.createSession(params.roomId);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: session.id,
      type: "START",
      message: "Recording started",
    });
    return session;
  },

  async stopRecordingSession(params: { actorId: string; sessionId: string }) {
    const session = await roomsRepository.findSession(params.sessionId);
    if (!session)
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    const canAccess = await roomsRepository.canUserAccessSession(params.sessionId, params.actorId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to stop recording" });
    }
    const result = await roomsRepository.markSessionComplete(params.sessionId);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: params.sessionId,
      type: "STOP",
      message: "Recording stopped",
    });

    // Queue background jobs
    try {
      const jobId = transcriptJobId(params.sessionId);
      const audioTrack = await roomsRepository.findFirstAudioTrack(params.sessionId);
      await prisma.recordingSession.update({
        where: { id: params.sessionId },
        data: { transcriptStatus: "processing", transcriptError: null },
      });
      if (audioTrack?.s3Key) {
        await getTranscriptQueue().add(
          jobId,
          { sessionId: params.sessionId, audioTrackS3Key: audioTrack.s3Key },
          { jobId },
        );
      } else {
        // Queue without audio URL — worker will retry until upload completes
        await getTranscriptQueue().add(
          jobId,
          { sessionId: params.sessionId, audioTrackS3Key: "" },
          { jobId, delay: 30000 },
        );
      }
    } catch {
      // Queue is optional — don't block session completion
    }

    return result;
  },

  async getRecordingSessions(roomId: string) {
    return roomsRepository.listSessions(roomId);
  },

  async getRecordingSessionById(sessionId: string) {
    const session = await roomsRepository.getSessionWithDetails(sessionId);
    if (!session)
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    return session;
  },

  async listRecentSessions(userId: string) {
    return roomsRepository.listRecentByCreator(userId);
  },
};
