import { prisma } from "@ototabi/store";

export const chatRepository = {
  async createMessage(data: { roomId: string; userId: string; message: string }) {
    return prisma.chatMessage.create({ data });
  },

  async findMessages(roomId: string, limit: number) {
    return prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  },
};
