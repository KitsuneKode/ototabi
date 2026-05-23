import { z } from 'zod'
import { prisma } from '@ototabi/store'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { protectedProcedure } from '../trpc'
import { TRPCError, type TRPCRouterRecord } from '@trpc/server'
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || 'mock-bucket'
const region = process.env.AWS_S3_REGION || 'us-east-1'
const endpoint = process.env.AWS_S3_ENDPOINT || process.env.MINIO_ENDPOINT || undefined

const isS3Configured = !!(accessKeyId && secretAccessKey && bucketName)

let s3Client: S3Client | null = null

if (isS3Configured) {
  s3Client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  })
} else {
  console.warn('[Uploads] S3/MinIO not configured, using mock fallback')
}

export const uploadsRouter = {
  start: protectedProcedure
    .input(
      z.object({
        trackSid: z.string(),
        sessionId: z.string(),
        type: z.enum(['CAMERA', 'MICROPHONE', 'SCREENSHARE']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { trackSid, sessionId, type } = input
      const key = `recordings/session_${sessionId}/track_${trackSid}.webm`
      let uploadId = `mock-upload-id-${Date.now()}`

      if (s3Client && isS3Configured) {
        try {
          const command = new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: 'video/webm',
          })
          const response = await s3Client.send(command)
          if (response.UploadId) uploadId = response.UploadId
        } catch (error) {
          console.error('[Uploads] S3 CreateMultipartUpload failed:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to initiate S3 upload',
          })
        }
      }

      try {
        await prisma.recordingTrack.create({
          data: {
            sessionId,
            userId: ctx.session.user.id,
            trackSid,
            type,
            status: 'UPLOADING',
            s3Key: key,
          },
        })
      } catch (dbError) {
        console.error('[Uploads] DB track creation error:', dbError)
      }

      return { uploadId, key }
    }),

  getSignedUrl: protectedProcedure
    .input(
      z.object({ key: z.string(), uploadId: z.string(), partNumber: z.number() }),
    )
    .mutation(async ({ input }) => {
      const { key, uploadId, partNumber } = input

      if (!s3Client || !isS3Configured || uploadId.startsWith('mock-upload-id')) {
        const mockUrl = `/api/mock-upload?key=${encodeURIComponent(key)}&uploadId=${uploadId}&partNumber=${partNumber}`
        return { url: mockUrl }
      }

      try {
        const command = new UploadPartCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        })
        const url = await getSignedUrl(s3Client, command, { expiresIn: 600 })
        return { url }
      } catch (error) {
        console.error('[Uploads] Failed to sign URL:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not generate upload URL',
        })
      }
    }),

  listParts: protectedProcedure
    .input(z.object({ key: z.string(), uploadId: z.string() }))
    .mutation(async ({ input }) => {
      const { key, uploadId } = input
      if (!s3Client || !isS3Configured || uploadId.startsWith('mock-upload-id')) {
        return { parts: [] }
      }
      try {
        const command = new ListPartsCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
        })
        const response = await s3Client.send(command)
        return { parts: response.Parts || [] }
      } catch (error) {
        console.error('[Uploads] ListParts failed:', error)
        return { parts: [] }
      }
    }),

  complete: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        uploadId: z.string(),
        parts: z.array(z.object({ ETag: z.string(), PartNumber: z.number() })),
      }),
    )
    .mutation(async ({ input }) => {
      const { key, uploadId, parts } = input

      if (s3Client && isS3Configured && !uploadId.startsWith('mock-upload-id')) {
        try {
          const command = new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts },
          })
          await s3Client.send(command)
        } catch (error) {
          console.error('[Uploads] S3 CompleteMultipartUpload failed:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to assemble S3 parts',
          })
        }
      }

      const finalUrl = isS3Configured
        ? (process.env.S3_PUBLIC_URL
          ? `${process.env.S3_PUBLIC_URL}/${key}`
          : endpoint
            ? `${endpoint}/${bucketName}/${key}`
            : `https://${bucketName}.s3.${region}.amazonaws.com/${key}`)
        : `/mock-uploads/${key}`

      try {
        await prisma.recordingTrack.updateMany({
          where: { s3Key: key },
          data: { status: 'COMPLETED', s3Url: finalUrl },
        })
      } catch (dbError) {
        console.error('[Uploads] DB update error:', dbError)
      }

      return { status: 'success' }
    }),

  getUploadStatus: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .query(async ({ input }) => {
      const track = await prisma.recordingTrack.findUnique({
        where: { id: input.trackId },
        select: { id: true, status: true, s3Url: true, type: true, trackSid: true },
      })
      if (!track) throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' })
      return track
    }),

  retryUpload: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .mutation(async ({ input }) => {
      const track = await prisma.recordingTrack.findUnique({
        where: { id: input.trackId },
      })
      if (!track) throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' })
      if (track.status === 'COMPLETED')
        return { status: 'already_completed' }

      await prisma.recordingTrack.update({
        where: { id: input.trackId },
        data: { status: 'UPLOADING' },
      })
      return { status: 'retrying', trackSid: track.trackSid, sessionId: track.sessionId, s3Key: track.s3Key }
    }),
} satisfies TRPCRouterRecord
