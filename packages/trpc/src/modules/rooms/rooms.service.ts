import { prisma } from "@ototabi/store";
import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";

import {
  defaultLobbyInviteExpiresAt,
  DEFAULT_LOBBY_MAX_USES,
  hashInviteToken,
} from "../studio-access/enter-studio";
import { studioAccessRepository } from "../studio-access/studio-access.repository";
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
    await studioAccessRepository.createInvite({
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
};
