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
