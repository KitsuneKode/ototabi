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

  canInviteMember(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return room.creatorId === userId || member?.role === "host";
  },

  canRemoveMember(actorRole: string | undefined, targetRole: string): boolean {
    if (!actorRole) return false;
    return actorRole === "host" || (actorRole === "editor" && targetRole !== "host");
  },
};
