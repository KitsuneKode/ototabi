import { describe, expect, test } from "bun:test";

import {
  clampPlayhead,
  clampTrimHandle,
  normalizeTrimRange,
  percentToSec,
  secToPercent,
} from "./timeline-math";

describe("clampPlayhead", () => {
  test("clamps below zero and above duration", () => {
    expect(clampPlayhead(-5, 120)).toBe(0);
    expect(clampPlayhead(200, 120)).toBe(120);
    expect(clampPlayhead(45.5, 120)).toBe(45.5);
  });

  test("returns zero for non-positive duration", () => {
    expect(clampPlayhead(10, 0)).toBe(0);
  });
});

describe("secToPercent / percentToSec", () => {
  test("round-trips midpoint", () => {
    expect(secToPercent(60, 120)).toBe(50);
    expect(percentToSec(50, 120)).toBe(60);
  });
});

describe("normalizeTrimRange", () => {
  test("enforces minimum gap between handles", () => {
    const { trimInSec, trimOutSec } = normalizeTrimRange(10, 10.2, 120, 0.5);
    expect(trimOutSec - trimInSec).toBeGreaterThanOrEqual(0.5);
  });

  test("swaps invalid ordering by extending out handle", () => {
    const { trimInSec, trimOutSec } = normalizeTrimRange(50, 20, 120);
    expect(trimInSec).toBe(50);
    expect(trimOutSec).toBeGreaterThan(trimInSec);
  });

  test("keeps handles inside duration", () => {
    const { trimInSec, trimOutSec } = normalizeTrimRange(-10, 500, 90);
    expect(trimInSec).toBeGreaterThanOrEqual(0);
    expect(trimOutSec).toBeLessThanOrEqual(90);
  });
});

describe("clampTrimHandle", () => {
  test("in handle cannot cross out minus gap", () => {
    expect(clampTrimHandle(95, 40, 120, "in", 0.5)).toBe(39.5);
  });

  test("out handle cannot cross in plus gap", () => {
    expect(clampTrimHandle(5, 40, 120, "out", 0.5)).toBe(40.5);
  });
});
