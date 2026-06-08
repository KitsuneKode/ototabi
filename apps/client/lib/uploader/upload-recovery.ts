import { db, type UploadSession } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";
import { S3Uploader } from "@/lib/uploader/s3-uploader";
import {
  countPendingChunks,
  resetStuckUploadingChunks,
  scheduleChunkUploads,
} from "@/lib/uploader/upload-chunk-queue";
import { UploadWorkerPool } from "@/lib/uploader/upload-worker-pool";

export interface UploadRecoveryProgress {
  uploaded: number;
  total: number;
}

export async function recoverPendingUpload(
  session: UploadSession,
  onProgress?: (progress: UploadRecoveryProgress) => void,
): Promise<void> {
  const uploader = new S3Uploader(session.trackSid, session.sessionId, session.type, session);

  await Promise.all([uploader.recoverExistingParts(), resetStuckUploadingChunks(session.trackSid)]);

  const total = await db.chunks
    .where("trackSid")
    .equals(session.trackSid)
    .filter((chunk) => chunk.status === "pending" || chunk.status === "failed")
    .count();

  const pool = new UploadWorkerPool();
  let uploaded = 0;
  onProgress?.({ uploaded, total });

  await pool.drain(
    async () => {
      await scheduleChunkUploads({
        pool,
        getUploader: () => uploader,
        trackSid: session.trackSid,
        onChunkUploaded: () => {
          uploaded++;
          onProgress?.({ uploaded, total });
        },
      });
    },
    async () => (await countPendingChunks(session.trackSid)) > 0,
  );

  const [pending, chunkParts] = await Promise.all([
    countPendingChunks(session.trackSid),
    db.chunks.where("trackSid").equals(session.trackSid).toArray(),
  ]);
  const maxPart = chunkParts.reduce((max, chunk) => Math.max(max, chunk.partNumber), 0);
  const expectedParts = Math.max(maxPart, uploader.getUploadedPartCount());
  if (pending > 0 || !uploader.hasAllParts(expectedParts)) {
    throw new Error(
      `Upload recovery incomplete for ${session.trackSid}: pending=${pending}, parts=${uploader.getUploadedPartCount()}/${expectedParts}`,
    );
  }

  await uploader.complete();
  await Promise.all([
    opfsStorage.deleteTrackChunks(session.sessionId, session.trackSid),
    db.uploadSessions.delete(session.trackSid),
  ]);
}
