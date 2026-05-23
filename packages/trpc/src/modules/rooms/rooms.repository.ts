import { prisma } from "@ototabi/store";

function generateRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 3; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${part1}-${part2}`;
}

export const roomsRepository = {
  async findUniqueCode(code: string) {
    return prisma.room.findUnique({ where: { code } });
  },

  async findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  },

  async findByIdWithRelations(id: string) {
    return prisma.room.findFirst({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });
  },

  async findByCodeWithRelations(code: string) {
    return prisma.room.findFirst({
      where: { code },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });
  },

  async create(data: { name: string; code: string; creatorId: string }) {
    return prisma.room.create({ data });
  },

  async update(id: string, data: { name?: string }) {
    return prisma.room.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.room.delete({ where: { id } });
  },

  async listByCreator(userId: string) {
    return prisma.room.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { sessions: true, participants: true } },
      },
    });
  },

  async generateUniqueCode(): Promise<string> {
    let code = generateRoomCode();
    for (let attempts = 0; attempts < 10; attempts++) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) return code;
      code = generateRoomCode();
    }
    return code;
  },

  // Participant methods
  async findParticipant(roomId: string, userId: string) {
    return prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  },

  async addParticipant(roomId: string, userId: string) {
    return prisma.roomParticipant.create({
      data: { roomId, userId },
    });
  },

  async removeParticipant(roomId: string, userId: string) {
    return prisma.roomParticipant.deleteMany({
      where: { roomId, userId },
    });
  },

  async listParticipants(roomId: string) {
    return prisma.roomParticipant.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  // Session methods
  async endActiveSessions(roomId: string) {
    return prisma.recordingSession.updateMany({
      where: { roomId, status: "RECORDING" },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async createSession(roomId: string) {
    return prisma.recordingSession.create({
      data: { roomId, status: "RECORDING", startedAt: new Date() },
    });
  },

  async findSession(sessionId: string) {
    return prisma.recordingSession.findUnique({ where: { id: sessionId } });
  },

  async markSessionComplete(sessionId: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async findFirstAudioTrack(sessionId: string) {
    return prisma.recordingTrack.findFirst({
      where: { sessionId, type: "MICROPHONE", status: "COMPLETED", s3Url: { not: null } },
      select: { s3Url: true },
    });
  },

  async listSessions(roomId: string) {
    return prisma.recordingSession.findMany({
      where: { roomId },
      orderBy: { startedAt: "desc" },
      include: {
        tracks: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async getSessionWithDetails(sessionId: string) {
    return prisma.recordingSession.findUnique({
      where: { id: sessionId },
      include: {
        room: { select: { id: true, name: true, code: true } },
        tracks: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async listRecentByCreator(userId: string, take = 10) {
    return prisma.recordingSession.findMany({
      where: { room: { creatorId: userId } },
      orderBy: { startedAt: "desc" },
      take,
      include: {
        room: { select: { id: true, name: true, code: true } },
        tracks: { select: { id: true, status: true, type: true } },
      },
    });
  },

  // Member methods
  async findMember(roomId: string, userId: string) {
    return prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  },

  async addMember(data: { roomId: string; userId: string; role: string; invitedBy?: string }) {
    return prisma.roomMember.create({ data });
  },

  async removeMember(roomId: string, userId: string) {
    return prisma.roomMember.deleteMany({ where: { roomId, userId } });
  },

  async listMembers(roomId: string) {
    return prisma.roomMember.findMany({
      where: { roomId },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  },

  async listRoomsByMember(userId: string) {
    return prisma.room.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { sessions: true, participants: true } },
      },
    });
  },
};
