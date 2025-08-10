// filename: db.ts

import Dexie, { type Table } from 'dexie'

/**
 * Defines the structure of a single recorded chunk stored in the database.
 * This acts as a reliable buffer, ensuring no data is lost if the upload fails.
 */
export interface StoredChunk {
  id: string // Composite key, e.g., `${trackSid}-${partNumber}`
  trackSid: string
  partNumber: number
  data: Blob // The raw video/audio blob data, which can be large
  status: 'pending' | 'uploading' | 'uploaded' | 'failed' // Tracks the upload state of the chunk
}

/**
 * Defines the structure for tracking an in-progress S3 multipart upload.
 * Persisting this data is the key to resuming uploads after a browser crash.
 */
export interface UploadSession {
  trackSid: string // The track this upload belongs to (this is the Primary Key)
  uploadId: string // The unique ID from S3 for this multipart upload
  s3Key: string // The final filename/key in the S3 bucket
}

/**
 * A Dexie wrapper around our IndexedDB database.
 * This class makes database operations (put, get, update, delete) simple and type-safe.
 */
export class ResilientRecordingDB extends Dexie {
  // Define the tables (object stores) in our database.
  // The '!' tells TypeScript that these properties will be initialized by Dexie.
  chunks!: Table<StoredChunk>
  uploadSessions!: Table<UploadSession>

  constructor() {
    super('resilientRecordingDB') // The name of our IndexedDB database
    this.version(1).stores({
      // Define the schema for version 1 of the database.
      // 'id' is the primary key for the 'chunks' table. 'status' and 'trackSid' are indexes
      // to allow for efficient querying (e.g., finding all 'pending' chunks).
      chunks: 'id, status, trackSid',
      // 'trackSid' is the primary key for the 'uploadSessions' table.
      uploadSessions: 'trackSid',
    })
  }
}

// Export a single, shared instance of the database to be used across the application.
export const db = new ResilientRecordingDB()
