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
});
