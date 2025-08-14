import { z } from 'zod'
import type { TRPCRouterRecord } from '@trpc/server'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'

// Initialize the S3 Client from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!

export const uploadsRouter = {
  /**
   * Initiates a new multipart upload in S3.
   */
  start: protectedProcedure
    .input(
      z.object({
        trackSid: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { trackSid } = input
      const key = `recordings/session_${Date.now()}/track_${trackSid}.webm`
      const command = new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: 'video/webm',
      })
      const response = await s3Client.send(command)
      return {
        uploadId: response.UploadId,
        key: response.Key,
      }
    }),

  /**
   * Generates a temporary, secure URL for the client to upload a single part.
   */
  getSignedUrl: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        uploadId: z.string(),
        partNumber: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { key, uploadId, partNumber } = input
      const command = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      })
      // This URL is short-lived (e.g., 10 minutes) and grants permission to PUT an object.
      const url = await getSignedUrl(s3Client, command, { expiresIn: 600 })
      return { url }
    }),

  /**
   * Used for crash recovery. Returns a list of parts already successfully uploaded to S3.
   */
  listParts: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        uploadId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { key, uploadId } = input
      const command = new ListPartsCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
      })
      const response = await s3Client.send(command)
      return { parts: response.Parts || [] }
    }),

  /**
   * Finalizes the multipart upload, assembling the parts into a single file in S3.
   */
  complete: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        uploadId: z.string(),
        parts: z.array(
          z.object({
            ETag: z.string(),
            PartNumber: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { key, uploadId, parts } = input
      const command = new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
      await s3Client.send(command)
      return { status: 'success' }
    }),
} satisfies TRPCRouterRecord
