import { describe, expect, test } from "bun:test";

import { roomsPolicy } from "./rooms.policy";

describe("roomsPolicy", () => {
  test("allows only the room host to update or delete a room", () => {
    const room = { creatorId: "host-1" };

    expect(roomsPolicy.canUpdateRoom(room, "host-1")).toBe(true);
    expect(roomsPolicy.canDeleteRoom(room, "host-1")).toBe(true);
    expect(roomsPolicy.canUpdateRoom(room, "guest-1")).toBe(false);
    expect(roomsPolicy.canDeleteRoom(room, "guest-1")).toBe(false);
  });

  test("allows hosts and creator to invite members", () => {
    const room = { creatorId: "creator-1" };

    expect(roomsPolicy.canInviteMember(null, room, "creator-1")).toBe(true);
    expect(roomsPolicy.canInviteMember({ role: "host" }, room, "member-1")).toBe(true);
    expect(roomsPolicy.canInviteMember({ role: "editor" }, room, "member-1")).toBe(false);
    expect(roomsPolicy.canInviteMember(null, room, "member-1")).toBe(false);
  });

  test("prevents lower-privilege members from removing hosts", () => {
    expect(roomsPolicy.canRemoveMember("host", "editor")).toBe(true);
    expect(roomsPolicy.canRemoveMember("host", "host")).toBe(true);
    expect(roomsPolicy.canRemoveMember("editor", "viewer")).toBe(true);
    expect(roomsPolicy.canRemoveMember("editor", "host")).toBe(false);
    expect(roomsPolicy.canRemoveMember(undefined, "viewer")).toBe(false);
  });

  test("rejects revoked, expired, and exhausted invites", () => {
    const now = new Date("2026-05-24T12:00:00.000Z");

    expect(
      roomsPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: null, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(true);
    expect(
      roomsPolicy.isInviteUsable(
        { revokedAt: now, expiresAt: null, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(false);
    expect(
      roomsPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: now, usedCount: 0, maxUses: null },
        now,
      ),
    ).toBe(false);
    expect(
      roomsPolicy.isInviteUsable(
        { revokedAt: null, expiresAt: null, usedCount: 1, maxUses: 1 },
        now,
      ),
    ).toBe(false);
  });

  test("allows room join with creator, membership, participation, or usable invite", () => {
    const room = { creatorId: "host-1" };

    expect(
      roomsPolicy.canJoinRoom({
        room,
        userId: "host-1",
        member: null,
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      roomsPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: { role: "editor" },
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      roomsPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: { userId: "user-1" },
        inviteUsable: false,
      }),
    ).toBe(true);
    expect(
      roomsPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: null,
        inviteUsable: true,
      }),
    ).toBe(true);
    expect(
      roomsPolicy.canJoinRoom({
        room,
        userId: "user-1",
        member: null,
        participant: null,
        inviteUsable: false,
      }),
    ).toBe(false);
  });
});
