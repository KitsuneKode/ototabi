import { DemoCursorLogger } from "@/lib/demo/demo-cursor-logger";
import {
  DEMO_DISPLAY_TRACK_SID,
  DEMO_MIC_TRACK_SID,
  DEMO_WEBCAM_TRACK_SID,
} from "@/lib/demo/demo-track-ids";
import { db } from "@/lib/localDB";
import { opfsStorage } from "@/lib/localDB/opfs-storage";
import { S3Uploader } from "@/lib/uploader/s3-uploader";
import {
  countPendingChunks,
  resetStuckUploadingChunks,
  scheduleChunkUploads,
} from "@/lib/uploader/upload-chunk-queue";
import { UploadWorkerPool } from "@/lib/uploader/upload-worker-pool";

type RecordingState = "idle" | "recording" | "stopped";

type TrackKind = "SCREENSHARE" | "MICROPHONE" | "CAMERA";

export class DemoCaptureManager {
  private state: RecordingState = "idle";
  private sessionId: string | null = null;
  private recorders = new Map<string, MediaRecorder>();
  private uploaders = new Map<string, S3Uploader>();
  private trackPartCounters = new Map<string, number>();
  private chunkWritePromises = new Map<string, Set<Promise<void>>>();
  private queueIntervalId: number | null = null;
  private readonly uploadPool = new UploadWorkerPool();
  private readonly chunkInterval = 4000;
  private readonly cursorLogger = new DemoCursorLogger();
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;

  async startCapture(sessionId: string, options: { includeMic: boolean; includeWebcam?: boolean }) {
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

    if (options.includeWebcam) {
      try {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: "user" },
          audio: false,
        });
      } catch {
        this.webcamStream = null;
      }
    }

    this.cursorLogger.start();
    this.queueIntervalId = window.setInterval(() => {
      void this.pumpUploadQueue();
    }, 500);

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

    if (this.webcamStream) {
      await this.startTrackRecorder(
        DEMO_WEBCAM_TRACK_SID,
        this.webcamStream,
        "CAMERA",
        "video/webm;codecs=vp9",
      );
    }

    const [videoTrack] = this.displayStream.getVideoTracks();
    videoTrack?.addEventListener("ended", () => {
      void this.stopCapture();
    });

    void this.pumpUploadQueue();
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
      await this.stopTrackRecorder(trackSid, { finalize: false });
    }

    await this.flushUploads();

    this.displayStream?.getTracks().forEach((t) => t.stop());
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.webcamStream?.getTracks().forEach((t) => t.stop());
    this.displayStream = null;
    this.micStream = null;
    this.webcamStream = null;

    const cursorEvents = this.cursorLogger.stop();
    return { cursorEvents };
  }

  async flushUploads(): Promise<void> {
    await this.drainUploads();
    const trackSids = Array.from(this.uploaders.keys());
    for (const trackSid of trackSids) {
      await this.finalizeTrackUpload(trackSid);
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
        void this.pumpUploadQueue(trackSid);
      } finally {
        writes?.delete(writePromise);
      }
    };

    recorder.start(this.chunkInterval);
    this.recorders.set(trackSid, recorder);
  }

  private async stopTrackRecorder(
    trackSid: string,
    options: { finalize: boolean } = { finalize: true },
  ) {
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

    await this.drainUploads(trackSid);

    if (options.finalize) {
      await this.finalizeTrackUpload(trackSid);
    }
  }

  private async pumpUploadQueue(trackSid?: string): Promise<void> {
    await scheduleChunkUploads({
      pool: this.uploadPool,
      getUploader: (sid) => this.uploaders.get(sid),
      trackSid,
      onChunkFailed: (sid, partNumber, error) => {
        console.error(`Demo upload failed for ${sid}-${partNumber}:`, error);
      },
    });
  }

  private async drainUploads(trackSid?: string): Promise<void> {
    await resetStuckUploadingChunks(trackSid);
    await this.uploadPool.drain(
      () => this.pumpUploadQueue(trackSid),
      async () => (await countPendingChunks(trackSid)) > 0,
    );
  }

  private async finalizeTrackUpload(trackSid: string): Promise<void> {
    const uploader = this.uploaders.get(trackSid);
    if (!uploader) return;

    const pending = await countPendingChunks(trackSid);
    const expectedParts = this.trackPartCounters.get(trackSid) ?? 0;
    if (pending > 0 || !uploader.hasAllParts(expectedParts)) {
      console.warn(
        `Demo skip complete for ${trackSid}: pending=${pending}, expected=${expectedParts}`,
      );
      return;
    }

    await uploader.complete();
    if (this.sessionId) {
      await opfsStorage.deleteTrackChunks(this.sessionId, trackSid);
    }
    await db.uploadSessions.delete(trackSid);
    this.uploaders.delete(trackSid);
    this.chunkWritePromises.delete(trackSid);
  }
}
