import { chatRepository } from "./chat.repository";

export const chatService = {
  async sendMessage(params: { userId: string; roomId: string; message: string }) {
    return chatRepository.createMessage({
      roomId: params.roomId,
      userId: params.userId,
      message: params.message,
    });
  },

  async getMessages(params: { roomId: string; limit?: number }) {
    return chatRepository.findMessages(params.roomId, params.limit ?? 50);
  },
};
