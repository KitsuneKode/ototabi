import type { Part } from '@aws-sdk/client-s3'
import { trpcClient } from '../../trpc/vanilla'

/**
 * Manages the S3/R2 multipart upload process for a single track by
 * communicating with the application's tRPC backend.
 */
export class S3Uploader {
  private readonly trackSid: string
  private readonly sessionId: string
  private readonly type: 'CAMERA' | 'MICROPHONE' | 'SCREENSHARE'
  private uploadId: string | null = null
  private s3Key: string | null = null
  private parts: Map<number, { ETag: string }> = new Map()

  /**
   * Initializes the uploader. If an existing session is provided,
   * it rehydrates the state, which is essential for crash recovery.
   * @param trackSid The SID of the track this uploader is responsible for.
   * @param sessionId The active recording session ID.
   * @param type The track source type.
   * @param existingSession Optional session data for recovering an incomplete upload.
   */
  constructor(
    trackSid: string,
    sessionId: string,
    type: 'CAMERA' | 'MICROPHONE' | 'SCREENSHARE',
    existingSession?: { uploadId: string; s3Key: string },
  ) {
    this.trackSid = trackSid
    this.sessionId = sessionId
    this.type = type
    if (existingSession) {
      this.uploadId = existingSession.uploadId
      this.s3Key = existingSession.s3Key
    }
  }

  // Getters to safely access internal state
  getUploadId = (): string | null => this.uploadId
  getS3Key = (): string | null => this.s3Key

  /**
   * Calls the backend to start a new multipart upload, receiving an uploadId and a final S3 key.
   */
  async start(): Promise<void> {
    try {
      const response = await trpcClient.uploads.start.mutate({
        trackSid: this.trackSid,
        sessionId: this.sessionId,
        type: this.type,
      })

      this.uploadId = response.uploadId
      this.s3Key = response.key
    } catch (err) {
      console.error('Failed to start multipart upload via tRPC:', err)
      throw new Error('Failed to start multipart upload.')
    }
  }

  /**
   * After a crash, this method asks the backend for a list of parts that were already
   * successfully uploaded, preventing wasteful re-uploads.
   */
  async recoverExistingParts(): Promise<void> {
    if (!this.uploadId || !this.s3Key) return
    try {
      const response = await trpcClient.uploads.listParts.mutate({
        key: this.s3Key,
        uploadId: this.uploadId,
      })

      const partsList = response.parts as Part[]
      for (const part of partsList) {
        if (part.PartNumber && part.ETag) {
          this.parts.set(part.PartNumber, { ETag: part.ETag })
        }
      }
    } catch (err) {
      console.error('Failed to recover existing parts via tRPC:', err)
      throw new Error('Failed to list existing parts.')
    }
  }

  /**
   * Uploads a single chunk of data as a part. Includes a retry mechanism
   * with exponential backoff to handle transient network errors.
   * @param chunk The Blob data to upload.
   * @param partNumber The sequential number of this part.
   * @param maxRetries The maximum number of times to retry a failed upload.
   * @param onProgress Callback to report progress of this specific chunk upload.
   */
  async uploadChunk(
    chunk: Blob,
    partNumber: number,
    maxRetries = 3,
    onProgress?: (sentBytes: number) => void,
  ): Promise<void> {
    if (!this.uploadId || !this.s3Key)
      throw new Error('Upload has not been started.')

    // Skip if already uploaded
    if (this.parts.has(partNumber)) {
      if (onProgress) onProgress(chunk.size)
      return
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 1. Fetch short-lived presigned URL from backend
        const { url } = await trpcClient.uploads.getSignedUrl.mutate({
          key: this.s3Key,
          uploadId: this.uploadId,
          partNumber,
        })

        let etag = 'mock-etag'

        // 2. Perform direct upload to S3/R2 or mock upload local bypass
        if (
          url.startsWith('/api/mock-upload') ||
          this.uploadId.startsWith('mock-upload-id')
        ) {
          // Simulate latency of a network request
          await new Promise((resolve) => setTimeout(resolve, 300))
          if (onProgress) onProgress(chunk.size)
        } else {
          // Real HTTP PUT request to AWS S3 / Cloudflare R2
          // Wrap in XMLHttpRequest to track progress if needed, or use simple fetch
          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: chunk,
          })

          if (!uploadResponse.ok) {
            throw new Error(
              `S3 PUT failed with status ${uploadResponse.status}`,
            )
          }

          const responseEtag = uploadResponse.headers.get('ETag')
          if (!responseEtag) {
            throw new Error('ETag not found in S3 response.')
          }
          etag = responseEtag
          if (onProgress) onProgress(chunk.size)
        }

        // 3. Store ETag for complete multipart upload
        this.parts.set(partNumber, { ETag: etag.replace(/"/g, '') })
        return
      } catch (error) {
        console.warn(
          `Attempt ${attempt} failed for part #${partNumber}:`,
          error,
        )
        if (attempt === maxRetries) throw error
        const delay = Math.pow(2, attempt) * 500
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Calls the backend to finalize the multipart upload, telling S3 to assemble all
   * the uploaded parts into a single file.
   */
  async complete(): Promise<void> {
    if (!this.uploadId || !this.s3Key || this.parts.size === 0) return
    const sortedParts = Array.from(this.parts.entries())
      .sort(([numA], [numB]) => numA - numB)
      .map(([PartNumber, { ETag }]) => ({ ETag, PartNumber }))

    try {
      await trpcClient.uploads.complete.mutate({
        key: this.s3Key,
        uploadId: this.uploadId,
        parts: sortedParts,
      })
    } catch (err) {
      console.error('Failed to complete upload via tRPC:', err)
      throw new Error('Failed to finalize upload.')
    }
  }
}
