import crypto from "node:crypto";

export class StudioAccessError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "StudioAccessError";
  }
}

function toAccessError(code: "NOT_FOUND" | "FORBIDDEN", message: string): StudioAccessError {
  return new StudioAccessError(code, message);
}

import { roomsPolicy } from "./rooms.policy";
import { roomsRepository } from "./rooms.repository";

export const DEFAULT_LOBBY_INVITE_DAYS = 7;
export const DEFAULT_LOBBY_MAX_USES = 50;

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function defaultLobbyInviteExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + DEFAULT_LOBBY_INVITE_DAYS * 24 * 60 * 60 * 1000);
}

export type StudioAccessSnapshot = {
  room: {
    id: string;
    code: string;
    creatorId: string;
    isLocked: boolean;
  };
  member: { role: string } | null;
  participant: { userId: string } | null;
  joinRequest: { status: string } | null;
  invite: {
    id: string;
    roomId: string;
    revokedAt: Date | null;
    expiresAt: Date | null;
    usedCount: number;
    maxUses: number | null;
  } | null;
  inviteUsable: boolean;
};

export async function loadStudioAccessSnapshot(params: {
  roomCode: string;
  userId: string;
  inviteToken?: string;
}): Promise<StudioAccessSnapshot | null> {
  const room = await roomsRepository.findUniqueCode(params.roomCode);
  if (!room) return null;

  const tokenHash = params.inviteToken ? hashInviteToken(params.inviteToken) : null;
  const { member, participant, joinRequest, invite } =
    await roomsRepository.findStudioAccessByRoomCode(room.id, params.userId, tokenHash);

  const inviteForRoom = invite && invite.roomId === room.id ? invite : null;
  const inviteUsable = inviteForRoom ? roomsPolicy.isInviteUsable(inviteForRoom) : false;

  return {
    room: {
      id: room.id,
      code: room.code,
      creatorId: room.creatorId,
      isLocked: room.isLocked,
    },
    member,
    participant,
    joinRequest,
    invite: inviteForRoom
      ? {
          id: inviteForRoom.id,
          roomId: inviteForRoom.roomId,
          revokedAt: inviteForRoom.revokedAt,
          expiresAt: inviteForRoom.expiresAt,
          usedCount: inviteForRoom.usedCount,
          maxUses: inviteForRoom.maxUses,
        }
      : null,
    inviteUsable,
  };
}

export type CanEnterStudioResult =
  | { allowed: true; consumeInvite: boolean }
  | { allowed: false; code: "FORBIDDEN" | "NOT_FOUND"; message: string; queuePending?: boolean };

export function canEnterStudio(
  snapshot: StudioAccessSnapshot,
  userId: string,
): CanEnterStudioResult {
  const lockDecision = roomsPolicy.canEnterLockedRoom({
    room: snapshot.room,
    userId,
    member: snapshot.member,
    participant: snapshot.participant,
    joinRequest: snapshot.joinRequest,
    inviteUsable: snapshot.inviteUsable,
  });

  if (!lockDecision.allowed) {
    return {
      allowed: false,
      code: "FORBIDDEN",
      message: lockDecision.message,
      queuePending: lockDecision.queuePending,
    };
  }

  const hasExistingAccess =
    snapshot.room.creatorId === userId || !!snapshot.member || !!snapshot.participant;

  if (hasExistingAccess) {
    return { allowed: true, consumeInvite: false };
  }

  if (
    roomsPolicy.canJoinRoom({
      room: snapshot.room,
      userId,
      member: snapshot.member,
      participant: snapshot.participant,
      inviteUsable: snapshot.inviteUsable,
    })
  ) {
    return { allowed: true, consumeInvite: !!snapshot.invite && snapshot.inviteUsable };
  }

  return {
    allowed: false,
    code: "FORBIDDEN",
    message: "A valid invite is required",
  };
}

export async function consumeInviteIfNeeded(params: {
  inviteId: string;
  roomId: string;
  userId: string;
}): Promise<void> {
  await roomsRepository.consumeInvite(params.inviteId, params.roomId, params.userId);
}

export async function ensurePendingJoinRequest(roomId: string, userId: string): Promise<void> {
  await roomsRepository.upsertJoinRequest({ roomId, userId, status: "pending" });
}

export async function enterStudio(params: {
  userId: string;
  roomCode: string;
  inviteToken?: string;
}): Promise<{ roomId: string; roomCode: string }> {
  const snapshot = await loadStudioAccessSnapshot({
    roomCode: params.roomCode,
    userId: params.userId,
    inviteToken: params.inviteToken,
  });

  if (!snapshot) {
    throw toAccessError("NOT_FOUND", "Room not found");
  }

  const decision = canEnterStudio(snapshot, params.userId);
  if (!decision.allowed) {
    if (decision.queuePending) {
      await ensurePendingJoinRequest(snapshot.room.id, params.userId);
    }
    throw toAccessError(decision.code, decision.message);
  }

  if (decision.consumeInvite && snapshot.invite) {
    await consumeInviteIfNeeded({
      inviteId: snapshot.invite.id,
      roomId: snapshot.room.id,
      userId: params.userId,
    });
  } else if (!snapshot.participant) {
    await roomsRepository.addParticipant(snapshot.room.id, params.userId);
  }

  return { roomId: snapshot.room.id, roomCode: snapshot.room.code };
}

export async function enterStudioForLiveKit(params: {
  userId: string;
  roomCode: string;
  inviteToken?: string;
}): Promise<{
  roomId: string;
  participantRole: string;
}> {
  const snapshot = await loadStudioAccessSnapshot({
    roomCode: params.roomCode,
    userId: params.userId,
    inviteToken: params.inviteToken,
  });

  if (!snapshot) {
    throw toAccessError("NOT_FOUND", "Room not found");
  }

  const decision = canEnterStudio(snapshot, params.userId);
  if (!decision.allowed) {
    if (decision.queuePending) {
      await ensurePendingJoinRequest(snapshot.room.id, params.userId);
    }
    throw toAccessError(decision.code, decision.message);
  }

  if (decision.consumeInvite && snapshot.invite) {
    await consumeInviteIfNeeded({
      inviteId: snapshot.invite.id,
      roomId: snapshot.room.id,
      userId: params.userId,
    });
  }

  const participantRole =
    snapshot.room.creatorId === params.userId ? "host" : (snapshot.member?.role ?? "participant");

  return { roomId: snapshot.room.id, participantRole };
}
