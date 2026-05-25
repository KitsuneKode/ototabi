import { DemoCursorLogger } from "@/lib/demo/demo-cursor-logger";
import { DEMO_DISPLAY_TRACK_SID, DEMO_MIC_TRACK_SID } from "@/lib/demo/demo-track-ids";
import { db } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";
import { S3Uploader } from "@/lib/uploader/s3-uploader";

type RecordingState = "idle" | "recording" | "stopped";

type TrackKind = "SCREENSHARE" | "MICROPHONE";

export class DemoCaptureManager {
  private state: RecordingState = "idle";
  private sessionId: string | null = null;
  private recorders = new Map<string, MediaRecorder>();
  private uploaders = new Map<string, S3Uploader>();
  private trackPartCounters = new Map<string, number>();
  private chunkWritePromises = new Map<string, Set<Promise<void>>>();
  private queueIntervalId: number | null = null;
  private readonly chunkInterval = 4000;
  private readonly cursorLogger = new DemoCursorLogger();
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;

  async startCapture(sessionId: string, options: { includeMic: boolean }) {
    if (this.state === "recording") return;
    this.sessionId = sessionId;
    this.state = "recording";

    this.displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    if (options.includeMic) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        this.micStream = null;
      }
    }

    this.cursorLogger.start();
    this.queueIntervalId = window.setInterval(() => this.processUploadQueue(), 1500);

    await this.startTrackRecorder(
      DEMO_DISPLAY_TRACK_SID,
      this.displayStream,
      "SCREENSHARE",
      "video/webm;codecs=vp9,opus",
    );

    if (this.micStream) {
      const audioOnly = new MediaStream(this.micStream.getAudioTracks());
      await this.startTrackRecorder(
        DEMO_MIC_TRACK_SID,
        audioOnly,
        "MICROPHONE",
        "audio/webm;codecs=opus",
      );
    }

    const [videoTrack] = this.displayStream.getVideoTracks();
    videoTrack?.addEventListener("ended", () => {
      void this.stopCapture();
    });
  }

  async stopCapture(): Promise<{ cursorEvents: ReturnType<DemoCursorLogger["stop"]> }> {
    if (this.state === "idle") {
      return { cursorEvents: this.cursorLogger.getEvents() };
    }
    this.state = "stopped";

    if (this.queueIntervalId) {
      clearInterval(this.queueIntervalId);
      this.queueIntervalId = null;
    }

    const trackSids = Array.from(this.recorders.keys());
    for (const trackSid of trackSids) {
      await this.stopTrackRecorder(trackSid);
    }

    this.displayStream?.getTracks().forEach((t) => t.stop());
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.displayStream = null;
    this.micStream = null;

    const cursorEvents = this.cursorLogger.stop();
    return { cursorEvents };
  }

  async flushUploads(): Promise<void> {
    for (let i = 0; i < 50; i++) {
      const pending = await db.chunks.where("status").anyOf("pending", "failed").first();
      if (!pending) break;
      await this.processUploadQueue(pending.trackSid);
      await new Promise((r) => setTimeout(r, 200));
    }

    for (const trackSid of Array.from(this.uploaders.keys())) {
      const uploader = this.uploaders.get(trackSid);
      if (uploader) {
        await uploader.complete();
        await db.uploadSessions.delete(trackSid);
      }
    }
    this.uploaders.clear();
  }

  private async startTrackRecorder(
    trackSid: string,
    stream: MediaStream,
    type: TrackKind,
    preferredMime: string,
  ) {
    if (!this.sessionId || this.recorders.has(trackSid)) return;

    const mimeType = MediaRecorder.isTypeSupported(preferredMime)
      ? preferredMime
      : type === "SCREENSHARE"
        ? "video/webm"
        : "audio/webm";

    const uploader = new S3Uploader(trackSid, this.sessionId, type);
    await uploader.start();
    this.uploaders.set(trackSid, uploader);
    this.trackPartCounters.set(trackSid, 0);

    await db.uploadSessions.put({
      trackSid,
      uploadId: uploader.getUploadId()!,
      s3Key: uploader.getS3Key()!,
      sessionId: this.sessionId,
      type,
    });

    const recorder = new MediaRecorder(stream, { mimeType });
    this.chunkWritePromises.set(trackSid, new Set());

    recorder.ondataavailable = async (e: BlobEvent) => {
      if (e.data.size === 0 || !this.sessionId) return;
      const partNumber = (this.trackPartCounters.get(trackSid) ?? 0) + 1;
      this.trackPartCounters.set(trackSid, partNumber);

      const writePromise = Promise.all([
        db.chunks.put({
          id: `${trackSid}-${partNumber}`,
          trackSid,
          partNumber,
          data: e.data,
          status: "pending",
        }),
        opfsStorage.writeChunk(this.sessionId, partNumber, trackSid, e.data),
      ]).then(() => undefined);

      const writes = this.chunkWritePromises.get(trackSid);
      writes?.add(writePromise);
      try {
        await writePromise;
      } finally {
        writes?.delete(writePromise);
      }
    };

    recorder.start(this.chunkInterval);
    this.recorders.set(trackSid, recorder);
  }

  private async stopTrackRecorder(trackSid: string) {
    const recorder = this.recorders.get(trackSid);
    if (recorder && recorder.state !== "inactive") {
      const stopped = new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
      });
      recorder.stop();
      await stopped;
      const writes = this.chunkWritePromises.get(trackSid);
      if (writes?.size) await Promise.all(Array.from(writes));
    }
    this.recorders.delete(trackSid);
    await this.processUploadQueue(trackSid);
  }

  private async processUploadQueue(specificTrackSid?: string) {
    const query = specificTrackSid
      ? db.chunks
          .where("trackSid")
          .equals(specificTrackSid)
          .filter((c) => c.status === "pending" || c.status === "failed")
      : db.chunks.where("status").anyOf("pending", "failed");

    const chunkToUpload = await query.first();
    if (!chunkToUpload) return;

    const uploader = this.uploaders.get(chunkToUpload.trackSid);
    if (!uploader) return;

    try {
      await db.chunks.update(chunkToUpload.id, { status: "uploading" });
      const chunkBlob =
        (await opfsStorage.readChunk(
          uploader.getSessionId(),
          chunkToUpload.partNumber,
          chunkToUpload.trackSid,
        )) ?? chunkToUpload.data;
      await uploader.uploadChunk(chunkBlob, chunkToUpload.partNumber);
      await db.chunks.delete(chunkToUpload.id);
    } catch (error) {
      await db.chunks.update(chunkToUpload.id, { status: "failed" });
      console.error(`Demo upload failed for ${chunkToUpload.id}:`, error);
    }
  }
}
