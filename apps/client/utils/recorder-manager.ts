// import { openDB } from 'idb'
// import { uploadToS3 } from './s3-upload'
import {
  LocalParticipant,
  LocalTrack,
  LocalTrackPublication,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client'

/**
 * Database setup for indexDB
 */

// const DB_NAME = 'recordingChunksDB'
// const STORE_NAME = 'chunks'

// const openDB = (): Promise<IDBDatabase> => {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open(DB_NAME, 1)

//     request.onerror = () => reject(request.error)
//     request.onsuccess = () => resolve(request.result)

//     request.onupgradeneeded = (event) => {
//       const db = (event.target as IDBOpenDBRequest).result
//       if (!db.objectStoreNames.contains(STORE_NAME)) {
//         db.createObjectStore(STORE_NAME, { keyPath: 'id' })
//       }
//     }
//   })
// }

// const saveChunk = async (
//   chunkId: string,
//   chunkData: Blob,
//   metadata: RecordingChunk,
// ): Promise<void> => {
//   const db = await openDB()
//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction(STORE_NAME, 'readwrite')
//     const store = transaction.objectStore(STORE_NAME)

//     const chunk = {
//       id: chunkId,
//       data: chunkData,
//       metadata,
//       timestamp: Date.now(),
//     }

//     const request = store.put(chunk)

//     request.onsuccess = () => resolve()
//     request.onerror = () => reject(request.error)
//   })
// }

// const getChunk = async (
//   chunkId: string,
// ): Promise<{ data: Blob; metadata: RecordingChunk } | undefined> => {
//   const db = await openDB()
//   return new Promise((resolve) => {
//     const transaction = db.transaction(STORE_NAME, 'readonly')
//     const store = transaction.objectStore(STORE_NAME)
//     const request = store.get(chunkId)

//     request.onsuccess = () => resolve(request.result)
//     request.onerror = () => resolve(undefined)
//   })
// }

// const deleteChunk = async (chunkId: string): Promise<void> => {
//   const db = await openDB()
//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction(STORE_NAME, 'readwrite')
//     const store = transaction.objectStore(STORE_NAME)
//     const request = store.delete(chunkId)

//     request.onsuccess = () => resolve()
//     request.onerror = () => reject(request.error)
//   })
// }

/**
 * Metadata for each recorded chunk.
 */
export interface RecordingChunk {
  id: string
  startTime: number // Milliseconds relative to session start
  endTime: number // Milliseconds relative to session start
  trackSid: string
}

/**
 * Represents a single, continuous recording session.
 * A new session is created when recording starts or after a reconnection.
 */
export interface RecordingSession {
  id: string
  startTime: number // Unix timestamp (ms) of session start
  chunks: Map<string, Blob> // Map from chunk id to blob data
  metadata: Map<string, RecordingChunk> // Map from chunk id to metadata
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

interface RecorderManagerOptions {
  room: Room
  /** How often to slice the recording into chunks (in ms) */
  chunkInterval?: number
}

/**
 * Manages local recording of multiple media tracks in a LiveKit room.
 * It is designed to be robust against reconnections and to produce
 * data that is easy to upload and process in a post-production pipeline.
 */
export class RecorderManager {
  private room: Room
  private localParticipant: LocalParticipant
  private recorders: Map<string, MediaRecorder> = new Map()
  private sessions: RecordingSession[] = []
  private currentSession: RecordingSession | null = null
  private state: RecordingState = 'idle'
  private recordingStartTimestamp = 0
  private chunkInterval: number

  constructor({ room, chunkInterval = 5000 }: RecorderManagerOptions) {
    this.room = room
    this.localParticipant = room.localParticipant
    this.chunkInterval = chunkInterval

    this.room.on(RoomEvent.Reconnected, this.handleReconnect)
    this.room.on(RoomEvent.Disconnected, this.handleDisconnect)
    this.localParticipant.on(
      RoomEvent.LocalTrackUnpublished,
      this.handleTrackUnpublished,
    )

    this.localParticipant.on(RoomEvent.LocalTrackPublished, (e) => {
      console.log('Track published sdfksdjfhlsd', e.trackInfo)
    })
  }

  /**
   * Starts the recording of all local tracks.
   */
  public async startRecording() {
    console.log('Starting recording')
    if (this.state === 'recording') {
      console.warn('Recording is already in progress.')
      return
    }

    this.state = 'recording'
    this.recordingStartTimestamp = performance.now()

    this.currentSession = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      chunks: new Map(),
      metadata: new Map(),
    }
    this.sessions.push(this.currentSession)

    this.localParticipant.trackPublications.forEach(({ track }) => {
      if (track) {
        this.startTrackRecorder(track)
      }
    })
  }

  private startTrackRecorder(track: LocalTrack) {
    console.log('Starting track recorder')
    if (
      !track.mediaStreamTrack ||
      !track.sid ||
      this.recorders.has(track.sid)
    ) {
      return
    }

    const mediaStream = new MediaStream()
    mediaStream.addTrack(track.mediaStreamTrack)

    const mimeType =
      track.kind === Track.Kind.Video
        ? 'video/webm;'
        : 'audio/webm; codecs=opus'

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.error(`MimeType ${mimeType} not supported for this track.`)
      return
    }

    const recorder = new MediaRecorder(mediaStream, { mimeType })
    this.recorders.set(track.sid, recorder)

    recorder.ondataavailable = (e) => {
      console.log('Track recorder got data')
      this.handleDataAvailable(e, track.sid!)
    }
    recorder.onerror = (e) => console.error('MediaRecorder error:', e)

    recorder.start(this.chunkInterval)
  }

  private async handleDataAvailable(event: BlobEvent, trackSid: string) {
    console.log('Handling data available')
    if (event.data.size === 0 || !this.currentSession) {
      return
    }

    const chunkId = crypto.randomUUID()
    const chunkMetadata: RecordingChunk = {
      id: chunkId,
      startTime: event.timeStamp - this.recordingStartTimestamp,
      endTime: performance.now() - this.recordingStartTimestamp,
      trackSid,
    }

    // try {
    //   // Store the chunk in IndexedDB
    //   await saveChunk(chunkId, event.data, chunkMetadata)

    //   // Update session metadata
    //   this.currentSession.chunks.set(chunkId, event.data)
    //   this.currentSession.metadata.set(chunkId, chunkMetadata)

    //   console.log(`Chunk ${chunkId} saved successfully`)
    // } catch (error) {
    //   console.error('Failed to save chunk:', error)
    //   // Optionally implement retry logic here
    // }
  }

  /**
   * Stops the recording for all tracks.
   */
  public async stopRecording() {
    console.log('Stopping recording')
    if (this.state === 'idle' || this.state === 'stopped') {
      return
    }

    this.state = 'stopped'
    this.recorders.forEach((recorder) => {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    })
    this.recorders.clear()
  }

  /**
   * Pauses the recording for all tracks.
   */
  public pauseRecording() {
    console.log('Pausing recording')
    if (this.state !== 'recording') {
      return
    }
    this.state = 'paused'
    this.recorders.forEach((recorder) => {
      if (recorder.state === 'recording') {
        recorder.requestData()
        recorder.pause()
      }
    })
  }

  /**
   * Resumes the recording for all tracks.
   */
  public resumeRecording() {
    console.log('Resuming recording')
    if (this.state !== 'paused') {
      return
    }
    this.state = 'recording'
    this.recorders.forEach((recorder) => {
      if (recorder.state === 'paused') {
        recorder.resume()
      }
    })
  }

  private handleReconnect = () => {
    if (this.state === 'recording' || this.state === 'paused') {
      const wasPaused = this.state === 'paused'
      console.log(
        'Reconnected, starting a new recording session for continuity.',
      )
      this.stopRecording()
      // A small delay to allow tracks to re-establish
      setTimeout(() => {
        this.startRecording()
        if (wasPaused) {
          this.pauseRecording()
        }
      }, 1000)
    }
  }

  private handleDisconnect = () => {
    if (this.state === 'recording' || this.state === 'paused') {
      console.log('Disconnected, stopping recording.')
      this.stopRecording()
    }
  }

  private handleTrackUnpublished = (
    trackPublication: LocalTrackPublication,
  ) => {
    const trackSid = trackPublication.trackSid
    const recorder = this.recorders.get(trackSid)
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      this.recorders.delete(trackSid)
    }
  }

  // /**
  //  * Returns all recorded sessions.
  //  */
  // public getRecordingSessions(): RecordingSession[] {
  //   return this.sessions
  // }

  // /**
  //  * Cleans up all resources and event listeners.
  //  */
  // /**
  //  * Uploads a recording session to S3
  //  */
  // public async uploadToS3(
  //   sessionId: string,
  //   onProgress?: (progress: number) => void,
  // ): Promise<string> {
  //   const session = this.sessions.find((s) => s.id === sessionId)
  //   if (!session) {
  //     throw new Error('Session not found')
  //   }

  //   try {
  //     // Combine all chunks
  //     const chunks = await this.getAllChunksFromDB(session)
  //     const sortedChunks = Array.from(chunks.entries()).sort(
  //       ([_, a], [__, b]) => a.metadata.startTime - b.metadata.startTime,
  //     )

  //     if (sortedChunks.length === 0) {
  //       throw new Error('No chunks found to upload')
  //     }

  //     // Create a single blob from all chunks
  //     const combinedBlob = new Blob(
  //       sortedChunks.map(([_, chunk]) => chunk.data),
  //       { type: sortedChunks[0][1].data.type },
  //     )

  //     // Generate a unique key for S3
  //     const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  //     const key = `recordings/session-${sessionId}-${timestamp}.webm`

  //     // Upload to S3
  //     const s3Url = await uploadToS3(combinedBlob, key, onProgress)
  //     console.log('Uploaded to S3:', s3Url)

  //     // Clean up local chunks after successful upload
  //     await this.cleanupSession(sessionId)

  //     return s3Url
  //   } catch (error) {
  //     console.error('Error uploading to S3:', error)
  //     throw error
  //   }
  // }

  // /**
  //  * Combines all chunks from a session and triggers a file download
  //  */
  // public async downloadSession(
  //   sessionId: string,
  //   fileName: string = 'recording',
  // ) {
  //   const session = this.sessions.find((s) => s.id === sessionId)
  //   if (!session) {
  //     throw new Error('Session not found')
  //   }

  //   // Get all chunks from IndexedDB
  //   const chunks = await this.getAllChunksFromDB(session)

  //   // Sort chunks by their start time
  //   const sortedChunks = Array.from(chunks.entries()).sort(
  //     ([_, a], [__, b]) => a.metadata.startTime - b.metadata.startTime,
  //   )

  //   if (sortedChunks.length === 0) {
  //     console.warn('No recording chunks found to download')
  //     return
  //   }

  //   // Combine chunks into a single Blob
  //   const combinedBlob = new Blob(
  //     sortedChunks.map(([_, chunk]) => chunk.data),
  //     { type: sortedChunks[0][1].data.type },
  //   )

  //   // Create download link
  //   const url = URL.createObjectURL(combinedBlob)
  //   const a = document.createElement('a')
  //   a.href = url
  //   a.download = `${fileName}.webm`
  //   document.body.appendChild(a)
  //   a.click()

  //   // Cleanup
  //   setTimeout(() => {
  //     document.body.removeChild(a)
  //     window.URL.revokeObjectURL(url)
  //   }, 0)
  // }

  // /**
  //  * Gets all chunks from IndexedDB for a session
  //  */
  // private async getAllChunksFromDB(
  //   session: RecordingSession,
  // ): Promise<Map<string, { data: Blob; metadata: RecordingChunk }>> {
  //   const chunks = new Map<string, { data: Blob; metadata: RecordingChunk }>()

  //   for (const [chunkId] of session.metadata) {
  //     const chunk = await getChunk(chunkId)
  //     if (chunk) {
  //       chunks.set(chunkId, chunk)
  //     }
  //   }

  //   return chunks
  // }

  // /**
  //  * Cleans up a recording session by removing all local chunks
  //  */
  // private async cleanupSession(sessionId: string) {
  //   const session = this.sessions.find((s) => s.id === sessionId)
  //   if (!session) return

  //   // Delete all chunks from IndexedDB
  //   for (const [chunkId] of session.metadata) {
  //     await deleteChunk(chunkId)
  //   }

  //   // Remove session from memory
  //   this.sessions = this.sessions.filter((s) => s.id !== sessionId)
  // }

  /**
   * Cleans up all resources and event listeners
   */
  public async cleanup() {
    console.log('Cleaning up recorder')
    this.stopRecording()
    this.room.off(RoomEvent.Reconnected, this.handleReconnect)
    this.room.off(RoomEvent.Disconnected, this.handleDisconnect)
    this.localParticipant.off(
      'localTrackUnpublished',
      this.handleTrackUnpublished,
    )

    // // Clean up IndexedDB
    // try {
    //   const db = await openDB()
    //   const transaction = db.transaction(STORE_NAME, 'readwrite')
    //   const store = transaction.objectStore(STORE_NAME)
    //   await new Promise((resolve, reject) => {
    //     const request = store.clear()
    //     request.onsuccess = resolve
    //     request.onerror = () => reject(request.error)
    //   })
    // } catch (error) {
    //   console.error('Error cleaning up IndexedDB:', error)
    // }
  }
}
