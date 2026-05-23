import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";

import { uploadsRepository } from "./uploads.repository";

const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.MINIO_SECRET_KEY ||
  process.env.MINIO_ROOT_PASSWORD;
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "mock-bucket";
const region = process.env.AWS_S3_REGION || "us-east-1";
const endpoint = process.env.AWS_S3_ENDPOINT || process.env.MINIO_ENDPOINT || undefined;

const isS3Configured = !!(accessKeyId && secretAccessKey && bucketName);

let s3Client: S3Client | null = null;

if (isS3Configured) {
  s3Client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });
} else {
  console.warn("[Uploads] S3/MinIO not configured, using mock fallback");
}

function buildS3Key(sessionId: string, trackSid: string): string {
  return `recordings/session_${sessionId}/track_${trackSid}.webm`;
}

function buildFinalUrl(key: string): string {
  if (!isS3Configured) return `/mock-uploads/${key}`;
  return process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL}/${key}`
    : endpoint
      ? `${endpoint}/${bucketName}/${key}`
      : `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export const uploadsService = {
  async startUpload(params: {
    trackSid: string;
    sessionId: string;
    type: "CAMERA" | "MICROPHONE" | "SCREENSHARE";
    userId: string;
  }) {
    const key = buildS3Key(params.sessionId, params.trackSid);
    let uploadId = `mock-upload-id-${Date.now()}`;

    if (s3Client && isS3Configured) {
      try {
        const command = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: "video/webm",
        });
        const response = await s3Client.send(command);
        if (response.UploadId) uploadId = response.UploadId;
      } catch (error) {
        console.error("[Uploads] S3 CreateMultipartUpload failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate S3 upload",
        });
      }
    }

    try {
      await uploadsRepository.createTrack({
        sessionId: params.sessionId,
        userId: params.userId,
        trackSid: params.trackSid,
        type: params.type,
        s3Key: key,
      });
    } catch (dbError) {
      console.error("[Uploads] DB track creation error:", dbError);
    }

    return { uploadId, key };
  },

  async getSignedUrl(params: { key: string; uploadId: string; partNumber: number }) {
    if (!s3Client || !isS3Configured || params.uploadId.startsWith("mock-upload-id")) {
      const mockUrl = `/api/mock-upload?key=${encodeURIComponent(params.key)}&uploadId=${params.uploadId}&partNumber=${params.partNumber}`;
      return { url: mockUrl };
    }

    try {
      const command = new UploadPartCommand({
        Bucket: bucketName,
        Key: params.key,
        UploadId: params.uploadId,
        PartNumber: params.partNumber,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });
      return { url };
    } catch (error) {
      console.error("[Uploads] Failed to sign URL:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate upload URL",
      });
    }
  },

  async listParts(params: { key: string; uploadId: string }) {
    if (!s3Client || !isS3Configured || params.uploadId.startsWith("mock-upload-id")) {
      return { parts: [] };
    }
    try {
      const command = new ListPartsCommand({
        Bucket: bucketName,
        Key: params.key,
        UploadId: params.uploadId,
      });
      const response = await s3Client.send(command);
      return { parts: response.Parts || [] };
    } catch (error) {
      console.error("[Uploads] ListParts failed:", error);
      return { parts: [] };
    }
  },

  async completeUpload(params: {
    key: string;
    uploadId: string;
    parts: { ETag: string; PartNumber: number }[];
  }) {
    if (s3Client && isS3Configured && !params.uploadId.startsWith("mock-upload-id")) {
      try {
        const command = new CompleteMultipartUploadCommand({
          Bucket: bucketName,
          Key: params.key,
          UploadId: params.uploadId,
          MultipartUpload: { Parts: params.parts },
        });
        await s3Client.send(command);
      } catch (error) {
        console.error("[Uploads] S3 CompleteMultipartUpload failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assemble S3 parts",
        });
      }
    }

    const finalUrl = buildFinalUrl(params.key);

    try {
      await uploadsRepository.markTrackComplete(params.key, finalUrl);
    } catch (dbError) {
      console.error("[Uploads] DB update error:", dbError);
    }

    return { status: "success" };
  },

  async getUploadStatus(trackId: string) {
    const track = await uploadsRepository.findTrackById(trackId);
    if (!track) throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
    return track;
  },

  async retryUpload(trackId: string) {
    const track = await uploadsRepository.findTrackBySid(trackId);
    if (!track) throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
    if (track.status === "COMPLETED") return { status: "already_completed" as const };
    await uploadsRepository.resetTrackStatus(trackId);
    return {
      status: "retrying" as const,
      trackSid: track.trackSid,
      sessionId: track.sessionId,
      s3Key: track.s3Key,
    };
  },
};
