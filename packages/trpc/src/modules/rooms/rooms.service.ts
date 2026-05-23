import { TRPCError } from "@trpc/server";

import { roomsPolicy } from "./rooms.policy";
import { roomsRepository } from "./rooms.repository";

export const roomsService = {
  async createRoom(params: { userId: string; name: string }) {
    const code = await roomsRepository.generateUniqueCode();
    return roomsRepository.create({
      name: params.name,
      code,
      creatorId: params.userId,
    });
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
    const room = await roomsRepository.findWithRelations(params.id || params.code || "");
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    return room;
  },

  async listRooms(userId: string) {
    return roomsRepository.listByCreator(userId);
  },

  async joinRoom(params: { userId: string; code: string }) {
    const room = await roomsRepository.findUniqueCode(params.code);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const existing = await roomsRepository.findParticipant(room.id, params.userId);
    if (existing) return room;
    await roomsRepository.addParticipant(room.id, params.userId);
    return room;
  },

  async leaveRoom(params: { userId: string; roomId: string }) {
    await roomsRepository.removeParticipant(params.roomId, params.userId);
    return { success: true };
  },

  async getRoomParticipants(roomId: string) {
    return roomsRepository.listParticipants(roomId);
  },

  async startRecordingSession(roomId: string) {
    const room = await roomsRepository.findById(roomId);
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    await roomsRepository.endActiveSessions(roomId);
    return roomsRepository.createSession(roomId);
  },

  async stopRecordingSession(sessionId: string) {
    const session = await roomsRepository.findSession(sessionId);
    if (!session)
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    return roomsRepository.markSessionComplete(sessionId);
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
