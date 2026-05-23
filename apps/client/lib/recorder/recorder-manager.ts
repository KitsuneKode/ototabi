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

  // Active session and byte tracking for progress calculation
  private sessionId: string | null = null;
  private trackTotalBytes: Map<string, number> = new Map();
  private trackUploadedPartsProgress: Map<string, Map<number, number>> = new Map();
  private trackPartSizes: Map<string, Map<number, number>> = new Map();
  private onLocalProgress?: (trackSid: string, progress: number) => void;

  constructor({
    room,
    onLocalProgress,
  }: {
    room: Room;
    onLocalProgress?: (trackSid: string, progress: number) => void;
  }) {
    this.room = room;
    this.localParticipant = room.localParticipant;
    this.onLocalProgress = onLocalProgress;

    this.handleTrackPublished = this.handleTrackPublished.bind(this);
    this.handleTrackUnpublished = this.handleTrackUnpublished.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);

    // Recover incomplete uploads from previous sessions
    this.recoverOrphanedUploads().then(() => {
      // Start the background queue processor
      this.queueIntervalId = window.setInterval(() => this.processUploadQueue(), 1500);
    });
  }

  /**
   * Starts the recording process for a given database session ID.
   * @param sessionId The database ID of the active RecordingSession.
   */
  public async startRecording(sessionId: string) {
    if (this.state === "recording") return;
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

    // Stop all active recorders
    const trackSids = Array.from(this.recorders.keys());
    for (const trackSid of trackSids) {
      await this.stopTrackRecorder(trackSid);
    }
  }

  /**
   * Checks IndexedDB for any sessions that were not completed (due to a crash)
   * and re-initializes their S3Uploaders to resume uploading.
   */
  private async recoverOrphanedUploads() {
    try {
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

        // Save chunk locally (dual storage: IndexedDB + OPFS)
        await db.chunks.put({
          id: `${trackSid}-${partNumber}`,
          trackSid,
          partNumber,
          data: e.data,
          status: "pending",
        });
        opfsStorage.writeChunk(this.sessionId!, partNumber, trackSid, e.data).catch(() => {});
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
   * Stops the recorder for a single track and finalizes its upload.
   * @param trackSid The SID of the track to stop.
   */
  private async stopTrackRecorder(trackSid: string) {
    const recorder = this.recorders.get(trackSid);
    if (recorder) {
      if (recorder.state !== "inactive") recorder.stop();
      this.recorders.delete(trackSid);
    }

    // Force run queue to process remaining chunks for this track
    await this.processUploadQueue(trackSid);

    const uploader = this.uploaders.get(trackSid);
    if (uploader) {
      try {
        await uploader.complete();
        // Broadcast final 100% progress
        this.broadcastUploadProgress(trackSid, 100);
        // Clean up session in DB
        await db.uploadSessions.delete(trackSid);
      } catch (err) {
        console.error(`Finalization failed for ${trackSid}:`, err);
      }
      this.uploaders.delete(trackSid);
    }
  }

  /**
   * Periodic queue processor. Picks up pending chunks and uploads them.
   */
  private async processUploadQueue(specificTrackSid?: string) {
    const query = specificTrackSid
      ? db.chunks.where({ trackSid: specificTrackSid, status: "pending" })
      : db.chunks.where("status").anyOf("pending", "failed");

    const chunkToUpload = await query.first();
    if (!chunkToUpload) return; // Nothing pending

    const uploader = this.uploaders.get(chunkToUpload.trackSid);
    if (!uploader) return;

    try {
      // Mark as uploading to lock the row
      await db.chunks.update(chunkToUpload.id, { status: "uploading" });

      // Upload the chunk with progress callback
      await uploader.uploadChunk(chunkToUpload.data, chunkToUpload.partNumber, 3, (sentBytes) => {
        this.handleChunkProgress(chunkToUpload.trackSid, chunkToUpload.partNumber, sentBytes);
      });

      // Delete completed chunk from IndexedDB to optimize disk space
      await db.chunks.delete(chunkToUpload.id);
    } catch (error) {
      await db.chunks.update(chunkToUpload.id, { status: "failed" });
      console.error(`Failed to upload chunk ${chunkToUpload.id}:`, error);
    }
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

    // Sum all uploaded bytes
    let totalUploaded = 0;
    uploadedParts.forEach((bytes) => {
      totalUploaded += bytes;
    });

    const totalBytes = this.trackTotalBytes.get(trackSid) || 1;
    const percentage = Math.min(Math.round((totalUploaded / totalBytes) * 100), 100);

    this.broadcastUploadProgress(trackSid, percentage);
  }

  /**
   * Broadcasts the progress over the LiveKit Room's reliable data channel.
   */
  private broadcastUploadProgress(trackSid: string, progress: number) {
    try {
      const payload = JSON.stringify({
        type: "upload_progress",
        trackSid,
        progress,
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
    this.stopTrackRecorder(pub.trackSid);
  };

  private handleDisconnect = () => {
    if (this.state === "recording") this.stopRecording();
  };

  /**
   * Cleans up all resources.
   */
  public async completeProcessing(
    onProgress?: (uploaded: number, total: number) => void,
  ): Promise<void> {
    // Drain remaining chunks from DB and wait for all uploaders to finish
    const remaining = await db.chunks
      .where("status")
      .anyOf("pending", "uploading", "failed")
      .count();
    const total = remaining + this.uploaders.size;

    let done = 0;
    if (onProgress) onProgress(done, total);

    // Flush the upload queue repeatedly until all chunks are processed
    for (let i = 0; i < 50; i++) {
      const pending = await db.chunks.where("status").anyOf("pending", "failed").first();
      if (!pending) break;
      await this.processUploadQueue(pending.trackSid);
      done++;
      if (onProgress) onProgress(done, total);
      // Small delay to let async operations settle
      await new Promise((r) => setTimeout(r, 200));
    }

    // Finalise all uploaders
    const trackSids = Array.from(this.uploaders.keys());
    for (const trackSid of trackSids) {
      try {
        const uploader = this.uploaders.get(trackSid);
        if (uploader) {
          await uploader.complete();
          this.broadcastUploadProgress(trackSid, 100);
          await db.uploadSessions.delete(trackSid);
        }
      } catch (err) {
        console.error(`Finalisation failed for ${trackSid}:`, err);
      }
      done++;
      if (onProgress) onProgress(done, total);
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
    this.state = "idle";
    this.sessionId = null;
  }
}
