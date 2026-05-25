export const DEFAULT_UPLOAD_POOL_LIMITS = {
  maxGlobalInFlight: 4,
  maxPerTrackInFlight: 3,
} as const;

export interface UploadPoolLimits {
  maxGlobalInFlight: number;
  maxPerTrackInFlight: number;
}

export interface UploadPoolTask {
  chunkId: string;
  trackSid: string;
  run: () => Promise<void>;
}

/** HTTP statuses and messages that warrant longer backoff before retry. */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes("503") || message.includes("429")) return true;
  if (message.includes("rate limit") || message.includes("slow down")) return true;
  return false;
}

export function rateLimitBackoffMs(attempt: number): number {
  const base = 1000;
  return Math.min(base * 2 ** attempt, 30_000);
}

/**
 * Bounded worker pool for multipart chunk PUTs.
 * Tracks in-flight work by chunk id and enforces global + per-track caps.
 */
export class UploadWorkerPool {
  private readonly maxGlobal: number;
  private readonly maxPerTrack: number;
  private globalInFlight = 0;
  private readonly trackInFlight = new Map<string, number>();
  private readonly inFlightIds = new Set<string>();
  private readonly idleResolvers: Array<() => void> = [];

  constructor(limits: Partial<UploadPoolLimits> = {}) {
    this.maxGlobal = limits.maxGlobalInFlight ?? DEFAULT_UPLOAD_POOL_LIMITS.maxGlobalInFlight;
    this.maxPerTrack = limits.maxPerTrackInFlight ?? DEFAULT_UPLOAD_POOL_LIMITS.maxPerTrackInFlight;
  }

  get inFlightCount(): number {
    return this.globalInFlight;
  }

  isInFlight(chunkId: string): boolean {
    return this.inFlightIds.has(chunkId);
  }

  canSchedule(trackSid: string, chunkId: string): boolean {
    if (this.inFlightIds.has(chunkId)) return false;
    if (this.globalInFlight >= this.maxGlobal) return false;
    const trackCount = this.trackInFlight.get(trackSid) ?? 0;
    if (trackCount >= this.maxPerTrack) return false;
    return true;
  }

  /** Schedules a task when capacity allows. Returns false if at capacity or already in-flight. */
  schedule(task: UploadPoolTask): boolean {
    if (!this.canSchedule(task.trackSid, task.chunkId)) return false;

    this.inFlightIds.add(task.chunkId);
    this.globalInFlight++;
    this.trackInFlight.set(task.trackSid, (this.trackInFlight.get(task.trackSid) ?? 0) + 1);

    void this.runTask(task);
    return true;
  }

  private async runTask(task: UploadPoolTask): Promise<void> {
    try {
      await task.run();
    } finally {
      this.inFlightIds.delete(task.chunkId);
      this.globalInFlight--;
      const trackCount = (this.trackInFlight.get(task.trackSid) ?? 1) - 1;
      if (trackCount <= 0) this.trackInFlight.delete(task.trackSid);
      else this.trackInFlight.set(task.trackSid, trackCount);
      this.resolveIdleWaiters();
    }
  }

  async waitUntilIdle(): Promise<void> {
    if (this.globalInFlight === 0) return;
    await new Promise<void>((resolve) => {
      this.idleResolvers.push(resolve);
    });
    if (this.globalInFlight > 0) return this.waitUntilIdle();
  }

  /**
   * Runs `pump` to fill available slots, waits for in-flight work, and repeats until
   * `isWorkRemaining` is false.
   */
  async drain(pump: () => Promise<void>, isWorkRemaining: () => Promise<boolean>): Promise<void> {
    do {
      await pump();
      await this.waitUntilIdle();
    } while (await isWorkRemaining());
  }

  private resolveIdleWaiters(): void {
    if (this.globalInFlight > 0) return;
    const waiters = this.idleResolvers.splice(0);
    for (const resolve of waiters) resolve();
  }
}
