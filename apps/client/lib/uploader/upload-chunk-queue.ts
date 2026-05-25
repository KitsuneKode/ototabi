import { db, type StoredChunk } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";

import type { S3Uploader } from "./s3-uploader";

import { isRateLimitError, rateLimitBackoffMs, type UploadWorkerPool } from "./upload-worker-pool";

export type ChunkUploadStatus = StoredChunk["status"];

export async function resetStuckUploadingChunks(trackSid?: string): Promise<number> {
  if (trackSid) {
    return db.chunks
      .where("trackSid")
      .equals(trackSid)
      .filter((chunk) => chunk.status === "uploading")
      .modify({ status: "failed" });
  }
  return db.chunks.where("status").equals("uploading").modify({ status: "failed" });
}

export async function countPendingChunks(trackSid?: string): Promise<number> {
  if (trackSid) {
    return db.chunks
      .where("trackSid")
      .equals(trackSid)
      .filter((c) => c.status === "pending" || c.status === "failed")
      .count();
  }
  return db.chunks.where("status").anyOf("pending", "failed").count();
}

export async function listSchedulableChunks(trackSid?: string, limit = 32): Promise<StoredChunk[]> {
  const query = trackSid
    ? db.chunks
        .where("trackSid")
        .equals(trackSid)
        .filter((c) => c.status === "pending" || c.status === "failed")
    : db.chunks.where("status").anyOf("pending", "failed");

  return query.limit(limit).toArray();
}

export async function loadChunkBlob(sessionId: string, chunk: StoredChunk): Promise<Blob> {
  return (await opfsStorage.readChunk(sessionId, chunk.partNumber, chunk.trackSid)) ?? chunk.data;
}

export interface ScheduleChunkUploadsOptions {
  pool: UploadWorkerPool;
  getUploader: (trackSid: string) => S3Uploader | undefined;
  trackSid?: string;
  onChunkUploaded?: (trackSid: string, partNumber: number) => void;
  onChunkProgress?: (trackSid: string, partNumber: number, sentBytes: number) => void;
  onChunkFailed?: (trackSid: string, partNumber: number, error: unknown) => void;
}

/**
 * Attempts to schedule pending/failed chunks up to pool capacity.
 * Returns true if more chunks may still be pending (caller should pump again after drain slice).
 */
export async function scheduleChunkUploads(options: ScheduleChunkUploadsOptions): Promise<boolean> {
  const chunks = await listSchedulableChunks(options.trackSid);
  let scheduled = 0;

  for (const chunk of chunks) {
    const uploader = options.getUploader(chunk.trackSid);
    if (!uploader) continue;

    const scheduledTask = options.pool.schedule({
      chunkId: chunk.id,
      trackSid: chunk.trackSid,
      run: async () => {
        await db.chunks.update(chunk.id, { status: "uploading" });
        try {
          const blob = await loadChunkBlob(uploader.getSessionId(), chunk);
          await uploadChunkWithRateLimitBackoff(uploader, blob, chunk.partNumber, (sent) => {
            options.onChunkProgress?.(chunk.trackSid, chunk.partNumber, sent);
          });
          await db.chunks.delete(chunk.id);
          options.onChunkUploaded?.(chunk.trackSid, chunk.partNumber);
        } catch (error) {
          await db.chunks.update(chunk.id, { status: "failed" });
          options.onChunkFailed?.(chunk.trackSid, chunk.partNumber, error);
          throw error;
        }
      },
    });

    if (scheduledTask) scheduled++;
  }

  const remaining = await countPendingChunks(options.trackSid);
  return remaining > 0;
}

async function uploadChunkWithRateLimitBackoff(
  uploader: S3Uploader,
  blob: Blob,
  partNumber: number,
  onProgress?: (sentBytes: number) => void,
): Promise<void> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await uploader.uploadChunk(blob, partNumber, 3, onProgress);
      return;
    } catch (error) {
      if (!isRateLimitError(error) || attempt === maxAttempts - 1) throw error;
      await new Promise((r) => setTimeout(r, rateLimitBackoffMs(attempt)));
    }
  }
}
