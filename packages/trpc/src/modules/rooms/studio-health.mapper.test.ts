import { describe, expect, test } from "bun:test";

import {
  aggregateUploadProgressByIdentity,
  mapConnectionUiStatus,
  mapConsentUiStatus,
  mapRecoveryUiHint,
  mapUploadQueueUiStatus,
  matchParticipantIdentity,
} from "./studio-health.mapper";

describe("mapConsentUiStatus", () => {
  test("not required when session not recording", () => {
    expect(mapConsentUiStatus({ hasRecordingConsent: false, sessionRecording: false })).toBe(
      "not_required",
    );
  });

  test("pending vs granted while recording", () => {
    expect(mapConsentUiStatus({ hasRecordingConsent: false, sessionRecording: true })).toBe(
      "pending",
    );
    expect(mapConsentUiStatus({ hasRecordingConsent: true, sessionRecording: true })).toBe(
      "granted",
    );
  });
});

describe("mapUploadQueueUiStatus", () => {
  test("idle with no entries", () => {
    expect(mapUploadQueueUiStatus([])).toBe("idle");
  });

  test("complete when all at 100", () => {
    expect(mapUploadQueueUiStatus([{ progress: 100 }, { progress: 100 }])).toBe("complete");
  });

  test("uploading when in progress", () => {
    expect(mapUploadQueueUiStatus([{ progress: 40, uploadedParts: 2, totalParts: 5 }])).toBe(
      "uploading",
    );
  });

  test("stalled when parts expected but none uploaded", () => {
    expect(mapUploadQueueUiStatus([{ progress: 10, uploadedParts: 0, totalParts: 8 }])).toBe(
      "stalled",
    );
  });
});

describe("mapRecoveryUiHint", () => {
  test("only local participant gets recoverable hint", () => {
    expect(mapRecoveryUiHint({ pendingLocalTrackCount: 2, isLocalParticipant: true })).toBe(
      "recoverable",
    );
    expect(mapRecoveryUiHint({ pendingLocalTrackCount: 2, isLocalParticipant: false })).toBe(
      "none",
    );
  });
});

describe("mapConnectionUiStatus", () => {
  test("local uses local health", () => {
    expect(
      mapConnectionUiStatus({
        isLocal: true,
        localHealth: "reconnecting",
        isPresentInRoom: true,
      }),
    ).toBe("reconnecting");
  });

  test("remote defaults to connected when present", () => {
    expect(
      mapConnectionUiStatus({
        isLocal: false,
        localHealth: "connected",
        isPresentInRoom: true,
      }),
    ).toBe("connected");
  });
});

describe("matchParticipantIdentity", () => {
  test("matches user id, name, or email", () => {
    const candidates = [
      { userId: "u1", name: "Alex Host", email: "alex@example.com" },
      { userId: "u2", name: "Guest One", email: "guest@example.com" },
    ];
    expect(matchParticipantIdentity("u1", candidates)).toBe("u1");
    expect(matchParticipantIdentity("Alex Host", candidates)).toBe("u1");
    expect(matchParticipantIdentity("guest@example.com", candidates)).toBe("u2");
    expect(matchParticipantIdentity("unknown", candidates)).toBeNull();
  });
});

describe("aggregateUploadProgressByIdentity", () => {
  test("filters progress rows for one participant", () => {
    const rows = aggregateUploadProgressByIdentity(
      [
        { identity: "Alex", entry: { progress: 50 } },
        { identity: "alex", entry: { progress: 80 } },
        { identity: "Bob", entry: { progress: 10 } },
      ],
      "Alex",
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.progress)).toEqual([50, 80]);
  });
});
