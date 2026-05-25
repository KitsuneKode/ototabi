import { describe, expect, test } from "bun:test";

import { isRateLimitError, rateLimitBackoffMs, UploadWorkerPool } from "./upload-worker-pool";

describe("isRateLimitError", () => {
  test("detects 503 and 429 status messages", () => {
    expect(isRateLimitError(new Error("S3 PUT rate limited with status 503"))).toBe(true);
    expect(isRateLimitError(new Error("failed with status 429"))).toBe(true);
    expect(isRateLimitError(new Error("rate limit exceeded"))).toBe(true);
  });

  test("ignores unrelated errors", () => {
    expect(isRateLimitError(new Error("network offline"))).toBe(false);
    expect(isRateLimitError("plain string")).toBe(false);
  });
});

describe("rateLimitBackoffMs", () => {
  test("grows exponentially with a ceiling", () => {
    expect(rateLimitBackoffMs(0)).toBe(1000);
    expect(rateLimitBackoffMs(1)).toBe(2000);
    expect(rateLimitBackoffMs(10)).toBe(30_000);
  });
});

describe("UploadWorkerPool", () => {
  test("respects global concurrency cap", async () => {
    const pool = new UploadWorkerPool({ maxGlobalInFlight: 2, maxPerTrackInFlight: 3 });
    let running = 0;
    let maxRunning = 0;
    const release: Array<() => void> = [];

    const tasks = Array.from({ length: 4 }, (_, index) => ({
      chunkId: `chunk-${index}`,
      trackSid: "track-a",
      run: async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise<void>((resolve) => {
          release.push(resolve);
        });
        running--;
      },
    }));

    expect(pool.schedule(tasks[0]!)).toBe(true);
    expect(pool.schedule(tasks[1]!)).toBe(true);
    expect(pool.schedule(tasks[2]!)).toBe(false);
    expect(pool.schedule(tasks[3]!)).toBe(false);

    await new Promise((r) => setTimeout(r, 10));
    expect(maxRunning).toBeLessThanOrEqual(2);

    while (release.length > 0) release.shift()?.();
    await pool.waitUntilIdle();
    expect(pool.inFlightCount).toBe(0);
  });

  test("respects per-track concurrency cap", async () => {
    const pool = new UploadWorkerPool({ maxGlobalInFlight: 10, maxPerTrackInFlight: 2 });
    const release: Array<() => void> = [];

    const makeTask = (id: string) => ({
      chunkId: id,
      trackSid: "track-a",
      run: async () => {
        await new Promise<void>((resolve) => {
          release.push(resolve);
        });
      },
    });

    expect(pool.schedule(makeTask("a"))).toBe(true);
    expect(pool.schedule(makeTask("b"))).toBe(true);
    expect(pool.schedule(makeTask("c"))).toBe(false);

    release.forEach((resolve) => resolve());
    await pool.waitUntilIdle();
  });

  test("skips duplicate chunk ids while in-flight", async () => {
    const pool = new UploadWorkerPool({ maxGlobalInFlight: 4, maxPerTrackInFlight: 3 });
    let resolveTask: (() => void) | undefined;
    const task = {
      chunkId: "dup",
      trackSid: "track-a",
      run: async () => {
        await new Promise<void>((resolve) => {
          resolveTask = resolve;
        });
      },
    };

    expect(pool.schedule(task)).toBe(true);
    expect(pool.schedule(task)).toBe(false);
    resolveTask?.();
    await pool.waitUntilIdle();
  });

  test("drain runs pump until work remaining is false", async () => {
    const pool = new UploadWorkerPool({ maxGlobalInFlight: 4, maxPerTrackInFlight: 3 });
    let pumpCalls = 0;
    let remaining = 3;

    await pool.drain(
      async () => {
        pumpCalls++;
      },
      async () => {
        remaining--;
        return remaining > 0;
      },
    );

    expect(pumpCalls).toBe(3);
  });
});
