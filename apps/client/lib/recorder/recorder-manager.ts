import {
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";

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

export class RecorderManager {
  private room: Room;
  private localParticipant: LocalParticipant;
  private recorders: Map<string, MediaRecorder> = new Map();
  private uploaders: Map<string, S3Uploader> = new Map();
  private trackPartCounters: Map<string, number> = new Map();
  private state: RecordingState = "idle";
  private chunkInterval: number = 4000; // Slice video every 4 seconds
  private queueIntervalId: number | null = null;
  private readonly uploadPool = new UploadWorkerPool();

  // Active session and byte tracking for progress calculation
  private sessionId: string | null = null;
  private trackTotalBytes: Map<string, number> = new Map();
  private trackUploadedPartsProgress: Map<string, Map<number, number>> = new Map();
  private trackPartSizes: Map<string, Map<number, number>> = new Map();
  private trackCompletedParts: Map<string, Set<number>> = new Map();
  private chunkWritePromises: Map<string, Set<Promise<void>>> = new Map();
  private onLocalProgress?: (trackSid: string, progress: number) => void;
  private assertRecordingConsent?: () => Promise<boolean>;

  constructor({
    room,
    onLocalProgress,
    assertRecordingConsent,
  }: {
    room: Room;
    onLocalProgress?: (trackSid: string, progress: number) => void;
    /** When set, local MediaRecorder does not start until this resolves true. */
    assertRecordingConsent?: () => Promise<boolean>;
  }) {
    this.room = room;
    this.localParticipant = room.localParticipant;
    this.onLocalProgress = onLocalProgress;
    this.assertRecordingConsent = assertRecordingConsent;

    this.handleTrackPublished = this.handleTrackPublished.bind(this);
    this.handleTrackUnpublished = this.handleTrackUnpublished.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);

    // Recover incomplete uploads from previous sessions
    this.recoverOrphanedUploads().then(() => {
      this.queueIntervalId = window.setInterval(() => {
        void this.pumpUploadQueue();
      }, 500);
      void this.pumpUploadQueue();
    });
  }

  /**
   * Starts the recording process for a given database session ID.
   * @param sessionId The database ID of the active RecordingSession.
   */
  public async startRecording(sessionId: string) {
    if (this.state === "recording") return;
    if (this.assertRecordingConsent) {
      const allowed = await this.assertRecordingConsent();
      if (!allowed) {
        throw new Error("RECORDING_CONSENT_REQUIRED");
      }
    }
    this.state = "recording";
    this.sessionId = sessionId;

    this.localParticipant.on(RoomEvent.LocalTrackPublished, this.handleTrackPublished);
    this.localParticipant.on(RoomEvent.LocalTrackUnpublished, this.handleTrackUnpublished);
    this.room.on(RoomEvent.Disconnected, this.handleDisconnect);

    // Start recording already published local tracks
    this.localParticipant.trackPublications.forEach(({ track }) => {
      if (track) this.startTrackRecorder(track as LocalTrack);
    });
  }

  /**
   * Stops the recording process, finalizes all uploads, and cleans up listeners.
   */
  public async stopRecording() {
    if (this.state === "idle" || this.state === "stopped") return;
    this.state = "stopped";

    if (this.queueIntervalId) clearInterval(this.queueIntervalId);
    this.queueIntervalId = null;

    this.localParticipant.off(RoomEvent.LocalTrackPublished, this.handleTrackPublished);
    this.localParticipant.off(RoomEvent.LocalTrackUnpublished, this.handleTrackUnpublished);
    this.room.off(RoomEvent.Disconnected, this.handleDisconnect);

    const trackSids = Array.from(this.recorders.keys());
    for (const trackSid of trackSids) {
      await this.stopTrackRecorder(trackSid, { finalize: false });
    }

    await this.completeProcessing();
  }

  public pauseRecording() {
    if (this.state !== "recording") return;
    for (const recorder of this.recorders.values()) {
      if (recorder.state === "recording") recorder.pause();
    }
  }

  public resumeRecording() {
    if (this.state !== "recording") return;
    for (const recorder of this.recorders.values()) {
      if (recorder.state === "paused") recorder.resume();
    }
  }

  public get isPaused(): boolean {
    for (const recorder of this.recorders.values()) {
      if (recorder.state === "paused") return true;
    }
    return false;
  }

  /**
   * Checks IndexedDB for any sessions that were not completed (due to a crash)
   * and re-initializes their S3Uploaders to resume uploading.
   */
  private async recoverOrphanedUploads() {
    try {
      await resetStuckUploadingChunks();
      const orphanedSessions = await db.uploadSessions.toArray();
      for (const session of orphanedSessions) {
        try {
          const uploader = new S3Uploader(
            session.trackSid,
            session.sessionId,
            session.type,
            session,
          );
          await uploader.recoverExistingParts();
          this.uploaders.set(session.trackSid, uploader);
        } catch (error) {
          console.error(`Failed to recover session for track ${session.trackSid}:`, error);
        }
      }
      void this.pumpUploadQueue();
    } catch (dbErr) {
      console.error("Failed to read orphaned sessions from Dexie:", dbErr);
    }
  }

  /**
   * Initializes and starts a MediaRecorder for a given media track.
   * @param track The LocalTrack to record.
   */
  private async startTrackRecorder(track: LocalTrack) {
    const trackSid = track.sid;
    if (!trackSid || !track.mediaStreamTrack || this.recorders.has(trackSid) || !this.sessionId)
      return;

    // Identify track type
    let type: "CAMERA" | "MICROPHONE" | "SCREENSHARE" = "CAMERA";
    if (track.source === Track.Source.Microphone) {
      type = "MICROPHONE";
    } else if (track.source === Track.Source.ScreenShare) {
      type = "SCREENSHARE";
    }

    try {
      // 1. Initialize and start the S3 uploader
      const uploader = new S3Uploader(trackSid, this.sessionId, type);
      await uploader.start();
      this.uploaders.set(trackSid, uploader);
      this.trackPartCounters.set(trackSid, 0);

      // 2. Save session to DB for crash recovery
      await db.uploadSessions.put({
        trackSid: trackSid,
        uploadId: uploader.getUploadId()!,
        s3Key: uploader.getS3Key()!,
        sessionId: this.sessionId,
        type,
      });

      // 3. Setup the browser's MediaRecorder
      const mediaStream = new MediaStream([track.mediaStreamTrack]);
      const mimeType =
        track.kind === Track.Kind.Video ? "video/webm;codecs=vp9,opus" : "audio/webm;codecs=opus";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(`MimeType ${mimeType} not supported.`);
      }

      const recorder = new MediaRecorder(mediaStream, { mimeType });

      // Initialize trackers
      this.trackTotalBytes.set(trackSid, 0);
      this.trackPartSizes.set(trackSid, new Map());
      this.trackUploadedPartsProgress.set(trackSid, new Map());
      this.trackCompletedParts.set(trackSid, new Set());
      this.chunkWritePromises.set(trackSid, new Set());

      // 4. Capture loop
      recorder.ondataavailable = async (e: BlobEvent) => {
        if (e.data.size === 0) return;
        const partNumber = (this.trackPartCounters.get(trackSid) ?? 0) + 1;
        this.trackPartCounters.set(trackSid, partNumber);

        // Store part size
        const sizes = this.trackPartSizes.get(trackSid);
        if (sizes) sizes.set(partNumber, e.data.size);

        // Add to total track size
        const total = this.trackTotalBytes.get(trackSid) ?? 0;
        this.trackTotalBytes.set(trackSid, total + e.data.size);

        // Save chunk locally before upload. stopRecording waits on these writes.
        const writePromise = Promise.all([
          db.chunks.put({
            id: `${trackSid}-${partNumber}`,
            trackSid,
            partNumber,
            data: e.data,
            status: "pending",
          }),
          opfsStorage.writeChunk(this.sessionId!, partNumber, trackSid, e.data),
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

      // 5. Start slicing data
      recorder.start(this.chunkInterval);
      this.recorders.set(trackSid, recorder);
    } catch (error) {
      console.error(`Failed to start recorder for ${trackSid}:`, error);
      this.uploaders.delete(trackSid);
    }
  }

  /**
   * Stops the recorder for a single track and finalizes its upload when requested.
   */
  private async stopTrackRecorder(
    trackSid: string,
    options: { finalize: boolean } = { finalize: true },
  ) {
    const recorder = this.recorders.get(trackSid);
    if (recorder) {
      if (recorder.state !== "inactive")
        await this.stopRecorderAndWaitForChunks(trackSid, recorder);
      this.recorders.delete(trackSid);
    }

    await this.drainTrackUploads(trackSid);

    if (options.finalize) {
      await this.finalizeTrackUpload(trackSid);
    }
  }

  private async stopRecorderAndWaitForChunks(trackSid: string, recorder: MediaRecorder) {
    const stopped = new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
    });
    recorder.stop();
    await stopped;

    const writes = this.chunkWritePromises.get(trackSid);
    if (writes?.size) {
      await Promise.all(Array.from(writes));
    }
  }

  private async pumpUploadQueue(trackSid?: string): Promise<void> {
    await scheduleChunkUploads({
      pool: this.uploadPool,
      getUploader: (sid) => this.uploaders.get(sid),
      trackSid,
      onChunkProgress: (sid, partNumber, sentBytes) => {
        this.handleChunkProgress(sid, partNumber, sentBytes);
      },
      onChunkUploaded: (sid, partNumber) => {
        const completed = this.trackCompletedParts.get(sid);
        completed?.add(partNumber);
        this.broadcastPartProgress(sid);
      },
      onChunkFailed: (sid, partNumber, error) => {
        console.error(`Failed to upload chunk ${sid}-${partNumber}:`, error);
      },
    });
  }

  private async drainTrackUploads(trackSid?: string): Promise<void> {
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
        `Skipping complete for ${trackSid}: pending=${pending}, expectedParts=${expectedParts}, uploaded=${uploader.getUploadedPartCount()}`,
      );
      return;
    }

    try {
      await uploader.complete();
      if (this.sessionId) {
        await opfsStorage.deleteTrackChunks(this.sessionId, trackSid);
      }
      this.broadcastPartProgress(trackSid, true);
      await db.uploadSessions.delete(trackSid);
    } catch (err) {
      console.error(`Finalization failed for ${trackSid}:`, err);
    }
    this.uploaders.delete(trackSid);
    this.chunkWritePromises.delete(trackSid);
  }

  /**
   * Updates upload progress locally and triggers the LiveKit Data Channel broadcast.
   */
  private handleChunkProgress(trackSid: string, partNumber: number, sentBytes: number) {
    let uploadedParts = this.trackUploadedPartsProgress.get(trackSid);
    if (!uploadedParts) {
      uploadedParts = new Map();
      this.trackUploadedPartsProgress.set(trackSid, uploadedParts);
    }
    uploadedParts.set(partNumber, sentBytes);

    this.broadcastPartProgress(trackSid);
    this.onLocalProgress?.(trackSid, this.getPartProgressPercent(trackSid));
  }

  private getPartProgressPercent(trackSid: string): number {
    const totalParts = this.trackPartCounters.get(trackSid) ?? 0;
    if (totalParts === 0) return 0;
    const uploader = this.uploaders.get(trackSid);
    const uploadedParts = uploader?.getUploadedPartCount() ?? 0;
    return Math.min(Math.round((uploadedParts / totalParts) * 100), 99);
  }

  private broadcastPartProgress(trackSid: string, isComplete = false) {
    const totalParts = this.trackPartCounters.get(trackSid) ?? 0;
    const uploader = this.uploaders.get(trackSid);
    const uploadedParts = isComplete ? totalParts : (uploader?.getUploadedPartCount() ?? 0);
    const progress =
      totalParts > 0
        ? isComplete
          ? 100
          : Math.min(Math.round((uploadedParts / totalParts) * 100), 99)
        : 0;

    try {
      const payload = JSON.stringify({
        type: "upload_progress",
        trackSid,
        progress,
        uploadedParts,
        totalParts,
      });
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      this.room.localParticipant.publishData(data, {
        reliable: true,
      });
    } catch (err) {
      console.warn("Failed to broadcast upload progress:", err);
    }
  }

  // --- LiveKit Event Handlers ---

  private handleTrackPublished = (pub: LocalTrackPublication) => {
    if (this.state === "recording" && pub.track) this.startTrackRecorder(pub.track);
  };

  private handleTrackUnpublished = (pub: LocalTrackPublication) => {
    void this.stopTrackRecorder(pub.trackSid);
  };

  private handleDisconnect = () => {
    if (this.state === "recording") void this.stopRecording();
  };

  /**
   * Drains the upload pool and finalizes all active multipart uploads.
   */
  public async completeProcessing(
    onProgress?: (uploaded: number, total: number) => void,
  ): Promise<void> {
    const trackSids = Array.from(this.uploaders.keys());
    const totalTracks = trackSids.length;
    let done = 0;
    onProgress?.(done, totalTracks);

    await this.drainTrackUploads();

    for (const trackSid of trackSids) {
      await this.finalizeTrackUpload(trackSid);
      done++;
      onProgress?.(done, totalTracks);
    }
  }

  public async cleanup() {
    if (this.state === "recording") {
      await this.stopRecording();
    }

    if (this.queueIntervalId) {
      clearInterval(this.queueIntervalId);
      this.queueIntervalId = null;
    }

    this.localParticipant.off(RoomEvent.LocalTrackPublished, this.handleTrackPublished);
    this.localParticipant.off(RoomEvent.LocalTrackUnpublished, this.handleTrackUnpublished);
    this.room.off(RoomEvent.Disconnected, this.handleDisconnect);

    this.recorders.clear();
    this.uploaders.clear();
    this.trackPartCounters.clear();
    this.trackTotalBytes.clear();
    this.trackUploadedPartsProgress.clear();
    this.trackPartSizes.clear();
    this.trackCompletedParts.clear();
    this.chunkWritePromises.clear();
    this.state = "idle";
    this.sessionId = null;
  }
}
