import { describe, expect, test } from "bun:test";

import { studioAccessPolicy } from "./studio-access.policy";

describe("studioAccessPolicy", () => {
  test("rejects revoked, expired, and exhausted invites", () => {
    const now = new Date("2026-05-24T12:00:00.000Z");

    expect(
      studioAccessPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: null, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(true);
    expect(
      studioAccessPolicy.isInviteUsable(
        { revokedAt: now, expiresAt: null, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(false);
    expect(
      studioAccessPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: now, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(false);
    expect(
      studioAccessPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: null, usedCount: 1, maxUses: 1 },
        now,
      ),
    ).toBe(false);
  });

  test("allows room join with creator, membership, participation, or usable invite", () => {
    const room = { creatorId: "host-1" };

    expect(
      studioAccessPolicy.canJoinRoom({
        room,
        userId: "host-1",
        member: null,
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      studioAccessPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: { role: "editor" },
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      studioAccessPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: { userId: "user-1" },
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      studioAccessPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: null,
        inviteUsable: true,
      }),
    ).toBe(true);
    expect(
      studioAccessPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(false);
  });

  test("locked room bypasses lock for host, members, and participants", () => {
    const room = { creatorId: "host-1", isLocked: true };

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "host-1",
        member: null,
        participant: null,
        joinRequest: null,
        inviteUsable: false,
      }),
    ).toEqual({ allowed: true });

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "user-1",
        member: { role: "editor" },
        participant: null,
        joinRequest: null,
        inviteUsable: false,
      }),
    ).toEqual({ allowed: true });

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "user-1",
        member: null,
        participant: { userId: "user-1" },
        joinRequest: null,
        inviteUsable: false,
      }),
    ).toEqual({ allowed: true });
  });

  test("locked room queues invite holders until admitted", () => {
    const room = { creatorId: "host-1", isLocked: true };

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "guest-1",
        member: null,
        participant: null,
        joinRequest: null,
        inviteUsable: true,
      }),
    ).toEqual({
      allowed: false,
      message: "Room is locked — waiting for host admission",
      queuePending: true,
    });

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "guest-1",
        member: null,
        participant: null,
        joinRequest: { status: "admitted" },
        inviteUsable: true,
      }),
    ).toEqual({ allowed: true });

    expect(
      studioAccessPolicy.canEnterLockedRoom({
        room,
        userId: "guest-1",
        member: null,
        participant: null,
        joinRequest: { status: "denied" },
        inviteUsable: true,
      }),
    ).toEqual({ allowed: false, message: "Host denied your join request" });
  });

  test("canControlStudio allows creator and host role members", () => {
    const room = { creatorId: "creator-1" };

    expect(studioAccessPolicy.canControlStudio(null, room, "creator-1")).toBe(true);
    expect(studioAccessPolicy.canControlStudio({ role: "host" }, room, "cohost-1")).toBe(true);
    expect(studioAccessPolicy.canControlStudio({ role: "editor" }, room, "editor-1")).toBe(false);
    expect(studioAccessPolicy.canControlStudio(null, room, "guest-1")).toBe(false);
  });

  test("co-host can manage join requests, lock, remove guest, and mute request", () => {
    const room = { creatorId: "creator-1" };
    const cohost = { role: "host" as const };

    expect(studioAccessPolicy.canManageJoinRequests(cohost, room, "cohost-1")).toBe(true);
    expect(studioAccessPolicy.canToggleRoomLock(cohost, room, "cohost-1")).toBe(true);
    expect(studioAccessPolicy.canRemoveGuest(cohost, room, "cohost-1")).toBe(true);
    expect(studioAccessPolicy.canRequestMute(cohost, room, "cohost-1")).toBe(true);
  });

  test("editor cannot control studio", () => {
    const room = { creatorId: "creator-1" };
    const editor = { role: "editor" as const };

    expect(studioAccessPolicy.canManageJoinRequests(editor, room, "editor-1")).toBe(false);
    expect(studioAccessPolicy.canToggleRoomLock(editor, room, "editor-1")).toBe(false);
    expect(studioAccessPolicy.canRemoveGuest(editor, room, "editor-1")).toBe(false);
    expect(studioAccessPolicy.canRequestMute(editor, room, "editor-1")).toBe(false);
  });
});
