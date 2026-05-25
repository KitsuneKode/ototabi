import { db, type UploadSession } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";
import { S3Uploader } from "@/lib/uploader/s3-uploader";

export interface UploadRecoveryProgress {
  uploaded: number;
  total: number;
}

export async function recoverPendingUpload(
  session: UploadSession,
  onProgress?: (progress: UploadRecoveryProgress) => void,
): Promise<void> {
  const uploader = new S3Uploader(session.trackSid, session.sessionId, session.type, session);
  await uploader.recoverExistingParts();

  await db.chunks
    .where("trackSid")
    .equals(session.trackSid)
    .filter((chunk) => chunk.status === "uploading")
    .modify({ status: "failed" });

  const total = await db.chunks
    .where("trackSid")
    .equals(session.trackSid)
    .filter((chunk) => chunk.status === "pending" || chunk.status === "failed")
    .count();
  let uploaded = 0;
  onProgress?.({ uploaded, total });

  while (true) {
    const chunk = await db.chunks
      .where("trackSid")
      .equals(session.trackSid)
      .filter((candidate) => candidate.status === "pending" || candidate.status === "failed")
      .first();
    if (!chunk) break;

    await db.chunks.update(chunk.id, { status: "uploading" });
    const blob =
      (await opfsStorage.readChunk(session.sessionId, chunk.partNumber, session.trackSid)) ??
      chunk.data;
    await uploader.uploadChunk(blob, chunk.partNumber);
    await db.chunks.delete(chunk.id);
    uploaded++;
    onProgress?.({ uploaded, total });
  }

  await uploader.complete();
  await opfsStorage.deleteTrackChunks(session.sessionId, session.trackSid);
  await db.uploadSessions.delete(session.trackSid);
}
