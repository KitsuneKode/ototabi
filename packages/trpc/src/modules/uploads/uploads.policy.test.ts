import { describe, expect, test } from "bun:test";

import { uploadsPolicy } from "./uploads.policy";

describe("uploadsPolicy", () => {
  test("denies upload actions when session is missing or owned by another user", () => {
    expect(uploadsPolicy.canActOnUploadSession(null, "user-a")).toBe(false);
    expect(uploadsPolicy.canActOnUploadSession(undefined, "user-a")).toBe(false);
    expect(uploadsPolicy.canActOnUploadSession({ userId: "user-b" }, "user-a")).toBe(false);
    expect(uploadsPolicy.canActOnUploadSession({ userId: "user-a" }, "user-a")).toBe(true);
  });
});
