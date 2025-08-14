// filename: recorder-manager.ts

import { db } from './indexDb'
import { S3Uploader } from './s3-uploader'
import {
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client'

type RecordingState = 'idle' | 'recording' | 'stopped'

/**
 * The central orchestrator for the local recording feature.
 */
export class RecorderManager {
  // State management properties
  private room: Room
  private localParticipant: LocalParticipant
  private recorders: Map<string, MediaRecorder> = new Map()
  private uploaders: Map<string, S3Uploader> = new Map()
  private trackPartCounters: Map<string, number> = new Map()
  private state: RecordingState = 'idle'
  private chunkInterval: number = 4000 // Slice video every 4 seconds
  private queueIntervalId: number | null = null // ID for the setInterval that runs the upload queue

  constructor({ room }: { room: Room }) {
    this.room = room
    this.localParticipant = room.localParticipant

    // Bind event handlers to ensure `this` is correctly scoped.
    this.handleTrackPublished = this.handleTrackPublished.bind(this)
    this.handleTrackUnpublished = this.handleTrackUnpublished.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)

    // On initialization, immediately check for and recover any incomplete uploads from previous sessions.
    this.recoverOrphanedUploads().then(() => {
      // Start the background queue processor only after recovery is complete.
      this.queueIntervalId = window.setInterval(
        () => this.processUploadQueue(),
        2000,
      )
    })
  }

  /**
   * Starts the recording process. It begins listening for LiveKit events
   * and starts recording any tracks that are already published.
   */
  public async startRecording() {
    if (this.state === 'recording') return
    this.state = 'recording'
    this.localParticipant.on(
      RoomEvent.LocalTrackPublished,
      this.handleTrackPublished,
    )
    this.localParticipant.on(
      RoomEvent.LocalTrackUnpublished,
      this.handleTrackUnpublished,
    )
    this.room.on(RoomEvent.Disconnected, this.handleDisconnect)
    this.localParticipant.trackPublications.forEach(({ track }) =>
      this.startTrackRecorder(track as LocalTrack),
    )
  }

  /**
   * Stops the recording process, finalizes all uploads, and cleans up listeners.
   */
  public async stopRecording() {
    if (this.state === 'idle' || this.state === 'stopped') return
    this.state = 'stopped'
    if (this.queueIntervalId) clearInterval(this.queueIntervalId)
    this.queueIntervalId = null
    this.localParticipant.off(
      RoomEvent.LocalTrackPublished,
      this.handleTrackPublished,
    )
    this.localParticipant.off(
      RoomEvent.LocalTrackUnpublished,
      this.handleTrackUnpublished,
    )
    this.room.off(RoomEvent.Disconnected, this.handleDisconnect)
    Array.from(this.recorders.keys()).forEach((trackSid) =>
      this.stopTrackRecorder(trackSid),
    )
  }

  /**
   * Checks IndexedDB for any sessions that were not completed (due to a crash)
   * and re-initializes their S3Uploaders to resume uploading.
   */
  private async recoverOrphanedUploads() {
    const orphanedSessions = await db.uploadSessions.toArray()

    for (const session of orphanedSessions) {
      try {
        const uploader = new S3Uploader(session.trackSid, session)
        await uploader.recoverExistingParts()
        this.uploaders.set(session.trackSid, uploader)
      } catch (error) {
        console.error(
          `Failed to recover session for track ${session.trackSid}`,
          error,
        )
      }
    }
  }

  /**
   * Initializes and starts a MediaRecorder for a given media track.
   * It also kicks off the S3 multipart upload and persists the session for recovery.
   * @param track The LocalTrack to record.
   */
  private async startTrackRecorder(track: LocalTrack) {
    const trackSid = track.sid
    if (!trackSid || !track.mediaStreamTrack || this.recorders.has(trackSid))
      return
    try {
      // 1. Initialize and start the S3 uploader
      const uploader = new S3Uploader(trackSid)
      await uploader.start()
      this.uploaders.set(trackSid, uploader)
      this.trackPartCounters.set(trackSid, 0)

      // 2. Save session to DB for crash recovery
      await db.uploadSessions.put({
        trackSid: trackSid,
        uploadId: uploader.getUploadId()!,
        s3Key: uploader.getS3Key()!,
      })

      // 3. Setup the browser's MediaRecorder
      const mediaStream = new MediaStream([track.mediaStreamTrack])
      const mimeType =
        track.kind === Track.Kind.Video
          ? 'video/webm;codecs=vp9,opus'
          : 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType))
        throw new Error(`MimeType ${mimeType} not supported.`)

      const recorder = new MediaRecorder(mediaStream, { mimeType })

      // 4. This is the core capture loop. When MediaRecorder provides a chunk of data...
      recorder.ondataavailable = async (e: BlobEvent) => {
        if (e.data.size === 0) return
        const partNumber = (this.trackPartCounters.get(trackSid) ?? 0) + 1
        this.trackPartCounters.set(trackSid, partNumber)
        // ...its ONLY job is to save it to IndexedDB. This is fast and non-blocking.
        // The actual upload happens in the background queue.
        await db.chunks.put({
          id: `${trackSid}-${partNumber}`,
          trackSid,
          partNumber,
          data: e.data,
          status: 'pending',
        })
      }

      // 5. Start recording, slicing data into chunks at the specified interval.
      recorder.start(this.chunkInterval)
      this.recorders.set(trackSid, recorder)
    } catch (error) {
      console.error(`Failed to start recorder for ${trackSid}:`, error)
      // Clean up if setup fails
      this.uploaders.delete(trackSid)
    }
  }

  /**
   * Stops the recorder for a single track and finalizes its upload.
   * @param trackSid The SID of the track to stop.
   */
  private async stopTrackRecorder(trackSid: string) {
    const recorder = this.recorders.get(trackSid)
    if (recorder) {
      if (recorder.state !== 'inactive') recorder.stop()
      this.recorders.delete(trackSid)
    }
    // Ensure any final chunks for this track are uploaded before completing.
    await this.processUploadQueue(trackSid)
    const uploader = this.uploaders.get(trackSid)
    if (uploader) {
      await uploader
        .complete()
        .catch((err) =>
          console.error(`Finalization failed for ${trackSid}`, err),
        )
      // Clean up the session from the DB and memory after successful completion.
      await db.uploadSessions.delete(trackSid)
      this.uploaders.delete(trackSid)
    }
  }

  /**
   * The background worker. It periodically queries the DB for pending chunks
   * and attempts to upload them.
   * @param specificTrackSid If provided, only process chunks for this track.
   */
  private async processUploadQueue(specificTrackSid?: string) {
    // Find one chunk that is 'pending' or 'failed'.
    const query = specificTrackSid
      ? db.chunks.where({ trackSid: specificTrackSid, status: 'pending' })
      : db.chunks.where('status').anyOf('pending', 'failed')

    const chunkToUpload = await query.first()
    if (!chunkToUpload) return // No work to do.

    // Faking upload for testing purposes
    console.log(
      `[TESTING] Faking upload for chunk ${chunkToUpload.id} part ${chunkToUpload.partNumber}`,
    )
    await db.chunks.update(chunkToUpload.id, { status: 'uploading' })
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    await db.chunks.update(chunkToUpload.id, { status: 'uploaded' })

    const uploader = this.uploaders.get(chunkToUpload.trackSid)
    if (!uploader) {
      // This can happen if recovery failed but chunks still exist.
      return
    }

    try {
      // Mark the chunk as 'uploading' to prevent other queue cycles from picking it up.
      await db.chunks.update(chunkToUpload.id, { status: 'uploading' })
      await uploader.uploadChunk(chunkToUpload.data, chunkToUpload.partNumber)
      // After successful upload, mark it as 'uploaded'.
      // You could also delete it here to save space: await db.chunks.delete(chunkToUpload.id);
      await db.chunks.update(chunkToUpload.id, { status: 'uploaded' })
    } catch (error) {
      // If upload fails after all retries, mark it as 'failed' so we can try again later.
      await db.chunks.update(chunkToUpload.id, { status: 'failed' })
      console.error(`Failed to upload chunk ${chunkToUpload.id}`, error)
    }
  }

  // --- LiveKit Event Handlers ---

  private handleTrackPublished = (pub: LocalTrackPublication) => {
    // If a user shares their screen after recording has started, start recording it.
    if (this.state === 'recording' && pub.track)
      this.startTrackRecorder(pub.track)
  }

  private handleTrackUnpublished = (pub: LocalTrackPublication) => {
    // If a user stops sharing a track, stop its specific recorder and finalize its upload.
    this.stopTrackRecorder(pub.trackSid)
  }

  private handleDisconnect = () => {
    // If the user disconnects from the room, stop everything gracefully.
    if (this.state === 'recording') this.stopRecording()
  }

  /**
   * Cleans up all resources, stops recording, and removes all event listeners.
   * This should be called when the component managing the recorder is unmounted.
   */
  public async cleanup() {
    console.log('🧹 Cleaning up RecorderManager...')

    // 1. Stop the recording if it's currently active. This will also
    //    handle finalizing any pending uploads for the last session.
    if (this.state === 'recording') {
      await this.stopRecording()
    }

    // 2. Ensure the background upload queue is stopped.
    if (this.queueIntervalId) {
      clearInterval(this.queueIntervalId)
      this.queueIntervalId = null
    }

    // 3. Remove any remaining event listeners to prevent memory leaks.
    this.localParticipant.off(
      RoomEvent.LocalTrackPublished,
      this.handleTrackPublished,
    )
    this.localParticipant.off(
      RoomEvent.LocalTrackUnpublished,
      this.handleTrackUnpublished,
    )
    this.room.off(RoomEvent.Disconnected, this.handleDisconnect)

    // 4. Clear all internal state.
    this.recorders.clear()
    this.uploaders.clear()
    this.trackPartCounters.clear()
    this.state = 'idle'
  }
}
