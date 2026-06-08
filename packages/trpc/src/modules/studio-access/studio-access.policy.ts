export const studioAccessPolicy = {
  isInviteUsable(
    invite: {
      revokedAt: Date | null;
      expiresAt: Date | null;
      usedCount: number;
      maxUses: number | null;
    },
    now = new Date(),
  ): boolean {
    if (invite.revokedAt) return false;
    if (invite.expiresAt && invite.expiresAt <= now) return false;
    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) return false;
    return true;
  },

  canJoinRoom(params: {
    room: { creatorId: string };
    userId: string;
    member: { role: string } | null;
    participant: { userId: string } | null;
    inviteUsable: boolean;
  }): boolean {
    return (
      params.room.creatorId === params.userId ||
      !!params.member ||
      !!params.participant ||
      params.inviteUsable
    );
  },

  hasStudioBypass(params: {
    room: { creatorId: string };
    userId: string;
    member: { role: string } | null;
    participant: { userId: string } | null;
  }): boolean {
    return params.room.creatorId === params.userId || !!params.member || !!params.participant;
  },

  canEnterLockedRoom(params: {
    room: { creatorId: string; isLocked: boolean };
    userId: string;
    member: { role: string } | null;
    participant: { userId: string } | null;
    joinRequest: { status: string } | null;
    inviteUsable: boolean;
  }): { allowed: true } | { allowed: false; message: string; queuePending?: boolean } {
    if (!params.room.isLocked) {
      return { allowed: true };
    }

    if (studioAccessPolicy.hasStudioBypass(params)) {
      return { allowed: true };
    }

    if (params.joinRequest?.status === "admitted") {
      return { allowed: true };
    }

    if (params.joinRequest?.status === "denied") {
      return { allowed: false, message: "Host denied your join request" };
    }

    if (params.inviteUsable) {
      return {
        allowed: false,
        message: "Room is locked — waiting for host admission",
        queuePending: true,
      };
    }

    return { allowed: false, message: "Room is locked" };
  },

  canControlStudio(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return room.creatorId === userId || member?.role === "host";
  },

  canManageJoinRequests(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return studioAccessPolicy.canControlStudio(member, room, userId);
  },

  canToggleRoomLock(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return studioAccessPolicy.canControlStudio(member, room, userId);
  },

  canRemoveGuest(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return studioAccessPolicy.canControlStudio(member, room, userId);
  },

  canRequestMute(
    member: { role: string } | null,
    room: { creatorId: string },
    userId: string,
  ): boolean {
    return studioAccessPolicy.canControlStudio(member, room, userId);
  },
};
