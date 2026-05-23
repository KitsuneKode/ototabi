export const roomsPolicy = {
  isRoomHost(room: { creatorId: string }, userId: string): boolean {
    return room.creatorId === userId;
  },

  canUpdateRoom(room: { creatorId: string }, userId: string): boolean {
    return room.creatorId === userId;
  },

  canDeleteRoom(room: { creatorId: string }, userId: string): boolean {
    return room.creatorId === userId;
  },
};
