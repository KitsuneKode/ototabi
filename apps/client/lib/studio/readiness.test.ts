import { describe, expect, test } from "bun:test";

import {
  aggregateReadiness,
  evaluateBrowserSupport,
  evaluateDevices,
  evaluateStorageQuota,
  mergeReadiness,
} from "./readiness";

describe("evaluateBrowserSupport", () => {
  test("blocks insecure context and missing APIs", () => {
    const findings = evaluateBrowserSupport({
      hasMediaDevices: false,
      hasMediaRecorder: false,
      hasIndexedDB: true,
      isSecureContext: false,
    });
    expect(findings.some((f) => f.code === "insecure_context" && f.level === "block")).toBe(true);
    expect(findings.some((f) => f.code === "no_media_devices" && f.level === "block")).toBe(true);
  });

  test("ok when core APIs present", () => {
    const findings = evaluateBrowserSupport({
      hasMediaDevices: true,
      hasMediaRecorder: true,
      hasIndexedDB: true,
      isSecureContext: true,
    });
    expect(findings).toEqual([expect.objectContaining({ level: "ok", code: "browser_ok" })]);
  });
});

describe("evaluateStorageQuota", () => {
  test("warns when estimate unavailable", () => {
    const findings = evaluateStorageQuota({ supported: false, quotaBytes: null, usageBytes: null });
    expect(findings[0]?.level).toBe("warn");
    expect(findings[0]?.code).toBe("storage_estimate_unavailable");
  });

  test("blocks critically low free space", () => {
    const minFree = 50 * 1024 * 1024;
    const findings = evaluateStorageQuota({
      supported: true,
      quotaBytes: minFree,
      usageBytes: minFree - minFree / 8,
      minFreeBytes: minFree,
    });
    expect(findings.some((f) => f.code === "storage_critical" && f.level === "block")).toBe(true);
  });

  test("warns on low but non-critical space", () => {
    const minFree = 50 * 1024 * 1024;
    const findings = evaluateStorageQuota({
      supported: true,
      quotaBytes: minFree,
      usageBytes: minFree - minFree / 2,
      minFreeBytes: minFree,
    });
    expect(findings.some((f) => f.code === "storage_low" && f.level === "warn")).toBe(true);
  });
});

describe("evaluateDevices", () => {
  test("blocks when mic required but denied", () => {
    const findings = evaluateDevices({
      audioInputCount: 0,
      videoInputCount: 1,
      audioEnabled: true,
      videoEnabled: false,
      micPermissionDenied: true,
      cameraPermissionDenied: false,
    });
    expect(findings.some((f) => f.code === "mic_denied" && f.level === "block")).toBe(true);
  });

  test("warns when camera enabled but missing", () => {
    const findings = evaluateDevices({
      audioInputCount: 1,
      videoInputCount: 0,
      audioEnabled: false,
      videoEnabled: true,
      micPermissionDenied: false,
      cameraPermissionDenied: false,
    });
    expect(findings.some((f) => f.code === "no_camera" && f.level === "warn")).toBe(true);
  });
});

describe("aggregateReadiness", () => {
  test("canEnter false when any block present", () => {
    const result = mergeReadiness(
      [{ level: "ok", code: "a", message: "ok" }],
      [{ level: "block", code: "b", message: "blocked" }],
      [{ level: "warn", code: "c", message: "warn" }],
    );
    expect(result.hasBlock).toBe(true);
    expect(result.hasWarn).toBe(true);
    expect(result.canEnter).toBe(false);
  });

  test("canEnter true with warnings only", () => {
    const result = aggregateReadiness([
      { level: "warn", code: "w", message: "warn" },
      { level: "ok", code: "o", message: "ok" },
    ]);
    expect(result.canEnter).toBe(true);
    expect(result.hasWarn).toBe(true);
    expect(result.hasBlock).toBe(false);
  });
});
