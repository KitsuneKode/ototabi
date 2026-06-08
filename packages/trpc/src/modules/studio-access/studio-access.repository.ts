import { prisma } from "@ototabi/store";

export const studioAccessRepository = {
  async findUniqueCode(code: string) {
    return prisma.room.findUnique({ where: { code } });
  },

  async findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  },

  async findStudioAccessByRoomCode(roomId: string, userId: string, tokenHash: string | null) {
    const [member, participant, joinRequest, invite] = await Promise.all([
      prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      prisma.roomParticipant.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      prisma.studioJoinRequest.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      tokenHash
        ? prisma.roomInvite.findUnique({
            where: { tokenHash },
            select: {
              id: true,
              roomId: true,
              revokedAt: true,
              expiresAt: true,
              usedCount: true,
              maxUses: true,
            },
          })
        : Promise.resolve(null),
    ]);
    return { member, participant, joinRequest, invite };
  },

  async findAccessContext(roomId: string, userId: string) {
    const [room, member, participant] = await Promise.all([
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId } } }),
      prisma.roomParticipant.findUnique({ where: { roomId_userId: { roomId, userId } } }),
    ]);
    return { room, member, participant };
  },

  async findMember(roomId: string, userId: string) {
    return prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  },

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

  async setRecordingConsent(roomId: string, userId: string, consentedAt: Date) {
    return prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { recordingConsentedAt: consentedAt },
      create: { roomId, userId, recordingConsentedAt: consentedAt },
    });
  },

  async getRecordingConsent(roomId: string, userId: string) {
    const row = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { recordingConsentedAt: true },
    });
    return row?.recordingConsentedAt ?? null;
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
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
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

  async upsertJoinRequest(data: { roomId: string; userId: string; status: string }) {
    return prisma.studioJoinRequest.upsert({
      where: { roomId_userId: { roomId: data.roomId, userId: data.userId } },
      update: { status: data.status },
      create: { roomId: data.roomId, userId: data.userId, status: data.status },
    });
  },

  async listJoinRequests(roomId: string, status?: string) {
    return prisma.studioJoinRequest.findMany({
      where: { roomId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
    });
  },

  async setRoomLocked(roomId: string, isLocked: boolean) {
    return prisma.room.update({ where: { id: roomId }, data: { isLocked } });
  },
};
