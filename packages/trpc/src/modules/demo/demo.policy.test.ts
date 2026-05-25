import { describe, expect, test } from "bun:test";

import { demoPolicy } from "./demo.policy";

describe("demoPolicy", () => {
  test("identifies demo sessions", () => {
    expect(demoPolicy.isDemoSession({ mode: "DEMO" })).toBe(true);
    expect(demoPolicy.isDemoSession({ mode: "STUDIO" })).toBe(false);
  });

  test("allows only the demo room host to manage", () => {
    const session = { id: "s1", mode: "DEMO", room: { creatorId: "host-1" } };
    expect(demoPolicy.canManageDemoSession(session, "host-1")).toBe(true);
    expect(demoPolicy.canManageDemoSession(session, "other")).toBe(false);
    expect(demoPolicy.canManageDemoSession(null, "host-1")).toBe(false);
    expect(demoPolicy.canManageDemoSession({ ...session, mode: "STUDIO" }, "host-1")).toBe(false);
  });
});
