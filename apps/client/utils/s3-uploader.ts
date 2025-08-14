// // filename: s3-uploader.ts

// import type { Part } from '@aws-sdk/client-s3'

// export class S3Uploader {
//   private readonly trackSid: string
//   private uploadId: string | null = null
//   private s3Key: string | null = null
//   private parts: Map<number, { ETag: string }> = new Map()

//   constructor(
//     trackSid: string,
//     existingSession?: { uploadId: string; s3Key: string },
//   ) {
//     this.trackSid = trackSid
//     if (existingSession) {
//       this.uploadId = existingSession.uploadId
//       this.s3Key = existingSession.s3Key
//     }
//   }

//   getUploadId = () => this.uploadId
//   getS3Key = () => this.s3Key

//   /**
//    * Calls your backend to start a multipart upload.
//    */
//   async start(): Promise<void> {
//     const response = await fetch('/api/uploads/start', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ trackSid: this.trackSid }),
//     })
//     if (!response.ok) throw new Error('Failed to start multipart upload.')
//     const { uploadId, key } = await response.json()
//     this.uploadId = uploadId
//     this.s3Key = key
//   }

//   /**
//    * Recovers the state of already uploaded parts from S3 via your backend.
//    */
//   async recoverExistingParts(): Promise<void> {
//     if (!this.uploadId || !this.s3Key) return

//     const response = await fetch('/api/uploads/list-parts', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ key: this.s3Key, uploadId: this.uploadId }),
//     })
//     if (!response.ok) throw new Error('Failed to list existing parts.')
//     const { parts } = (await response.json()) as { parts: Part[] }

//     for (const part of parts) {
//       if (part.PartNumber && part.ETag) {
//         this.parts.set(part.PartNumber, { ETag: part.ETag })
//       }
//     }
//   }

//   /**
//    * Uploads a single chunk of data as a part, with retry logic.
//    */
//   async uploadChunk(
//     chunk: Blob,
//     partNumber: number,
//     maxRetries = 3,
//   ): Promise<void> {
//     if (!this.uploadId || !this.s3Key)
//       throw new Error('Upload has not been started.')
//     // Avoid re-uploading parts that were recovered
//     if (this.parts.has(partNumber)) return

//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//       try {
//         const presignedUrlResponse = await fetch(
//           '/api/uploads/get-presigned-url',
//           {
//             /* ... */
//           },
//         )
//         const { url } = await presignedUrlResponse.json()

//         const uploadResponse = await fetch(url, { method: 'PUT', body: chunk })
//         if (!uploadResponse.ok)
//           throw new Error(`S3 PUT failed with status ${uploadResponse.status}`)

//         const etag = uploadResponse.headers.get('ETag')
//         if (!etag) throw new Error('ETag not found.')

//         this.parts.set(partNumber, { ETag: etag.replace(/"/g, '') })
//         return // Success
//       } catch (error) {
//         if (attempt === maxRetries) throw error
//         const delay = Math.pow(2, attempt - 1) * 1000
//         await new Promise((resolve) => setTimeout(resolve, delay))
//       }
//     }
//   }

//   /**
//    * Calls your backend to finalize the multipart upload.
//    */
//   async complete(): Promise<void> {
//     if (!this.uploadId || !this.s3Key || this.parts.size === 0) return

//     const sortedParts = Array.from(this.parts.entries())
//       .sort(([numA], [numB]) => numA - numB)
//       .map(([PartNumber, { ETag }]) => ({ ETag, PartNumber }))

//     await fetch('/api/uploads/complete', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         key: this.s3Key,
//         uploadId: this.uploadId,
//         parts: sortedParts,
//       }),
//     })
//   }
// }
// filename: s3-uploader.ts

import type { Part } from '@aws-sdk/client-s3'

/**
 * Manages the S3 multipart upload process for a single track by
 * communicating with your application's backend.
 */
export class S3Uploader {
  // Properties to hold the state of the multipart upload
  private readonly trackSid: string
  private uploadId: string | null = null
  private s3Key: string | null = null
  private parts: Map<number, { ETag: string }> = new Map()

  /**
   * Initializes the uploader. If an existing session is provided,
   * it rehydrates the state, which is essential for crash recovery.
   * @param trackSid The SID of the track this uploader is responsible for.
   * @param existingSession Optional session data for recovering an incomplete upload.
   */
  constructor(
    trackSid: string,
    existingSession?: { uploadId: string; s3Key: string },
  ) {
    this.trackSid = trackSid
    if (existingSession) {
      this.uploadId = existingSession.uploadId
      this.s3Key = existingSession.s3Key
    }
  }

  // Getters to safely access internal state from the RecorderManager
  getUploadId = (): string | null => this.uploadId
  getS3Key = (): string | null => this.s3Key

  /**
   * Calls the backend to start a new multipart upload, receiving an uploadId and a final S3 key.
   */
  async start(): Promise<void> {
    const response = await fetch('/api/uploads/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackSid: this.trackSid }),
    })

    if (!response.ok) throw new Error('Failed to start multipart upload.')
    const { uploadId, key } = await response.json()
    this.uploadId = uploadId
    this.s3Key = key
  }

  /**
   * After a crash, this method asks the backend for a list of parts that were already
   * successfully uploaded to S3, preventing wasteful re-uploads.
   */
  async recoverExistingParts(): Promise<void> {
    if (!this.uploadId || !this.s3Key) return
    const response = await fetch('/api/uploads/list-parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: this.s3Key, uploadId: this.uploadId }),
    })
    if (!response.ok) throw new Error('Failed to list existing parts.')
    const { parts } = (await response.json()) as { parts: Part[] }
    for (const part of parts) {
      if (part.PartNumber && part.ETag) {
        this.parts.set(part.PartNumber, { ETag: part.ETag })
      }
    }
  }

  /**
   * Uploads a single chunk of data as a part. It includes a retry mechanism
   * with exponential backoff to handle transient network errors.
   * @param chunk The Blob data to upload.
   * @param partNumber The sequential number of this part.
   * @param maxRetries The maximum number of times to retry a failed upload.
   */
  async uploadChunk(
    chunk: Blob,
    partNumber: number,
    maxRetries = 3,
  ): Promise<void> {
    if (!this.uploadId || !this.s3Key)
      throw new Error('Upload has not been started.')
    // If we recovered state, we might already have this part. Skip if so.
    if (this.parts.has(partNumber)) {
      console.log(
        `Part #${partNumber} for track ${this.trackSid} already uploaded, skipping.`,
      )
      return
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 1. Get a short-lived, secure URL from our backend for the upload.
        const presignedUrlResponse = await fetch(
          '/api/uploads/get-presigned-url',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: this.s3Key,
              uploadId: this.uploadId,
              partNumber,
            }),
          },
        )
        if (!presignedUrlResponse.ok)
          throw new Error('Failed to get pre-signed URL.')
        const { url } = await presignedUrlResponse.json()

        // 2. Upload the data blob directly to S3 from the browser.
        // This offloads the bandwidth requirement from our server.
        const uploadResponse = await fetch(url, { method: 'PUT', body: chunk })
        if (!uploadResponse.ok)
          throw new Error(`S3 PUT failed with status ${uploadResponse.status}`)

        // 3. Extract the ETag from the response headers. This is required by S3 to complete the upload.
        const etag = uploadResponse.headers.get('ETag')
        if (!etag) throw new Error('ETag not found in S3 response.')

        // 4. Store the ETag for the final completion step.
        this.parts.set(partNumber, { ETag: etag.replace(/"/g, '') })
        return // Success!
      } catch (error) {
        console.warn(
          `Attempt ${attempt} failed for part #${partNumber}:`,
          error,
        )
        if (attempt === maxRetries) throw error // If all retries fail, throw the error up.
        // Wait before retrying, increasing the delay with each attempt.
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
    // The parts must be sorted by PartNumber for the complete call.
    const sortedParts = Array.from(this.parts.entries())
      .sort(([numA], [numB]) => numA - numB)
      .map(([PartNumber, { ETag }]) => ({ ETag, PartNumber }))

    await fetch('/api/uploads/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: this.s3Key,
        uploadId: this.uploadId,
        parts: sortedParts,
      }),
    })
  }
}
