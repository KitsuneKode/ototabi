import { describe, expect, test } from "bun:test";

import type { StudioAccessSnapshot } from "./enter-studio";

import {
  canEnterStudio,
  DEFAULT_LOBBY_INVITE_DAYS,
  DEFAULT_LOBBY_MAX_USES,
  defaultLobbyInviteExpiresAt,
} from "./enter-studio";

function snapshot(overrides: Partial<StudioAccessSnapshot> = {}): StudioAccessSnapshot {
  return {
    room: {
      id: "room-1",
      code: "abc-defg",
      creatorId: "host-1",
      isLocked: false,
    },
    member: null,
    participant: null,
    joinRequest: null,
    invite: null,
    inviteUsable: false,
    ...overrides,
  };
}

describe("enter-studio defaults", () => {
  test("lobby invite defaults to 7 days and 50 max uses", () => {
    const now = new Date("2026-05-26T00:00:00.000Z");
    const expires = defaultLobbyInviteExpiresAt(now);
    expect(DEFAULT_LOBBY_INVITE_DAYS).toBe(7);
    expect(DEFAULT_LOBBY_MAX_USES).toBe(50);
    expect(expires.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("canEnterStudio", () => {
  test("allows host and existing participants without invite", () => {
    expect(
      canEnterStudio(snapshot({ room: { ...snapshot().room, creatorId: "host-1" } }), "host-1"),
    ).toEqual({
      allowed: true,
      consumeInvite: false,
    });
    expect(canEnterStudio(snapshot({ participant: { userId: "guest-1" } }), "guest-1")).toEqual({
      allowed: true,
      consumeInvite: false,
    });
  });

  test("requires usable invite for new guests", () => {
    expect(canEnterStudio(snapshot(), "guest-1")).toEqual({
      allowed: false,
      code: "FORBIDDEN",
      message: "A valid invite is required",
    });
    expect(
      canEnterStudio(
        snapshot({
          invite: {
            id: "inv-1",
            roomId: "room-1",
            revokedAt: null,
            expiresAt: null,
            usedCount: 0,
            maxUses: 1,
          },
          inviteUsable: true,
        }),
        "guest-1",
      ),
    ).toEqual({ allowed: true, consumeInvite: true });
  });

  test("blocks locked room until admitted", () => {
    const locked = snapshot({
      room: { id: "room-1", code: "x", creatorId: "host-1", isLocked: true },
      inviteUsable: true,
      invite: {
        id: "inv-1",
        roomId: "room-1",
        revokedAt: null,
        expiresAt: null,
        usedCount: 0,
        maxUses: 10,
      },
    });

    const denied = canEnterStudio(locked, "guest-1");
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.queuePending).toBe(true);
    }

    const admitted = canEnterStudio({ ...locked, joinRequest: { status: "admitted" } }, "guest-1");
    expect(admitted).toEqual({ allowed: true, consumeInvite: true });
  });
});
