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

  async findAccessContext(roomId: string, userId: string) {
    const [room, member, participant] = await Promise.all([
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      prisma.roomParticipant.findUnique({ where: { roomId_userId: { roomId, userId } } }),
    ]);
    return { room, member, participant };
  },

  async canUserAccessSession(sessionId: string, userId: string) {
    const session = await prisma.recordingSession.findFirst({
      where: {
        id: sessionId,
        room: {
          OR: [
            { creatorId: userId },
            { members: { some: { userId } } },
            { participants: { some: { userId } } },
          ],
        },
      },
      select: { id: true },
    });
    return !!session;
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
    return prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: {},
      create: { roomId, userId },
    });
  },

  async createInvite(data: {
    roomId: string;
    tokenHash: string;
    role: string;
    email?: string;
    maxUses?: number;
    expiresAt?: Date;
    createdBy: string;
  }) {
    return prisma.roomInvite.create({ data });
  },

  async listInvites(roomId: string) {
    return prisma.roomInvite.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        roomId: true,
        role: true,
        email: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  },

  async findInviteByTokenHash(tokenHash: string) {
    return prisma.roomInvite.findUnique({
      where: { tokenHash },
      include: { room: true },
    });
  },

  async revokeInvite(inviteId: string) {
    return prisma.roomInvite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
  },

  async consumeInvite(inviteId: string, roomId: string, userId: string) {
    return prisma.$transaction([
      prisma.roomInvite.update({
        where: { id: inviteId },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.roomParticipant.upsert({
        where: { roomId_userId: { roomId, userId } },
        update: {},
        create: { roomId, userId },
      }),
    ]);
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

  async findActiveSessionByRoom(roomId: string) {
    return prisma.recordingSession.findFirst({
      where: { roomId, status: "RECORDING" },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
  },

  async markSessionComplete(sessionId: string) {
    return prisma.recordingSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  },

  async findFirstAudioTrack(sessionId: string) {
    return prisma.recordingTrack.findFirst({
      where: {
        sessionId,
        type: "MICROPHONE",
        status: "COMPLETED",
        OR: [{ s3Key: { not: "" } }, { s3Url: { not: null } }],
      },
      select: { s3Key: true, s3Url: true },
    });
  },

  async listSessions(roomId: string, take = 50) {
    return prisma.recordingSession.findMany({
      where: { roomId },
      orderBy: { startedAt: "desc" },
      take,
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
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true, participants: true } },
      },
    });
  },

  async listByCreatorSlim(userId: string) {
    return prisma.room.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true, participants: true } },
      },
    });
  },
};
