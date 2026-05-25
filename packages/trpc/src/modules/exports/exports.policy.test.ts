import { describe, expect, test } from "bun:test";

import { exportsPolicy } from "./exports.policy";

describe("exportsPolicy", () => {
  test("canBundleAssets rejects unknown and not-ready selections", () => {
    const assets = [
      { id: "track:a", status: "ready" as const },
      { id: "track:b", status: "processing" as const },
    ];

    expect(exportsPolicy.canBundleAssets(assets, ["track:a"])).toEqual({ ok: true });
    expect(exportsPolicy.canBundleAssets(assets, ["track:b"])).toEqual({
      ok: false,
      notReadyIds: ["track:b"],
      unknownIds: [],
    });
    expect(exportsPolicy.canBundleAssets(assets, ["missing"])).toEqual({
      ok: false,
      notReadyIds: [],
      unknownIds: ["missing"],
    });
  });
});
