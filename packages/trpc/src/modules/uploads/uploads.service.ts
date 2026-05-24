import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";

import { recordingEventsService } from "../recording-events/recording-events.service";
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
    const canUpload = await uploadsRepository.canUserUploadToSession({
      sessionId: params.sessionId,
      userId: params.userId,
    });
    if (!canUpload) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to upload tracks for this recording session",
      });
    }

    const existing = await uploadsRepository.findActiveUpload({
      sessionId: params.sessionId,
      trackSid: params.trackSid,
      userId: params.userId,
    });
    if (existing) return { uploadId: existing.uploadId, key: existing.s3Key };

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

    await uploadsRepository.createTrack({
      sessionId: params.sessionId,
      userId: params.userId,
      trackSid: params.trackSid,
      type: params.type,
      s3Key: key,
    });

    await uploadsRepository.createUploadSession({
      sessionId: params.sessionId,
      userId: params.userId,
      trackSid: params.trackSid,
      type: params.type,
      uploadId,
      s3Key: key,
    });

    return { uploadId, key };
  },

  async requireUploadOwner(params: { userId: string; key: string; uploadId: string }) {
    const upload = await uploadsRepository.findUploadForUser(params);
    if (!upload) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Upload session not found or not owned by this user",
      });
    }
    return upload;
  },

  async getSignedUrl(params: {
    key: string;
    uploadId: string;
    partNumber: number;
    userId: string;
  }) {
    await this.requireUploadOwner(params);

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

  async listParts(params: { key: string; uploadId: string; userId: string }) {
    await this.requireUploadOwner(params);

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
    userId: string;
  }) {
    const upload = await this.requireUploadOwner(params);

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
        await uploadsRepository.markUploadFailed(params);
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
      await recordingEventsService.createEvent({
        actorId: params.userId,
        sessionId: upload.sessionId,
        type: "UPLOAD_COMPLETED",
        trackSid: upload.trackSid,
        message: `${upload.type} upload completed`,
        metadata: { s3Key: upload.s3Key },
      });
    } catch (dbError) {
      console.error("[Uploads] DB update error:", dbError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Upload completed but database update failed",
      });
    }

    return { status: "success" };
  },

  async getUploadStatus(params: { trackId: string; userId: string }) {
    const canAccess = await uploadsRepository.canUserAccessTrack(params.trackId, params.userId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this track" });
    }
    const track = await uploadsRepository.findTrackById(params.trackId);
    if (!track) throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
    return track;
  },

  async retryUpload(params: { trackId: string; userId: string }) {
    const canAccess = await uploadsRepository.canUserAccessTrack(params.trackId, params.userId);
    if (!canAccess) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to retry this track" });
    }
    const track = await uploadsRepository.findTrackBySid(params.trackId);
    if (!track) throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
    if (track.status === "COMPLETED") return { status: "already_completed" as const };
    await uploadsRepository.resetTrackStatus(params.trackId);
    return {
      status: "retrying" as const,
      trackSid: track.trackSid,
      sessionId: track.sessionId,
      s3Key: track.s3Key,
    };
  },
};
