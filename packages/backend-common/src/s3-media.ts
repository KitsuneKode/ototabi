import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile } from "node:fs/promises";

const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.MINIO_SECRET_KEY ||
  process.env.MINIO_ROOT_PASSWORD;
export const s3BucketName =
  process.env.AWS_S3_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "mock-bucket";
const region = process.env.AWS_S3_REGION || "us-east-1";
const endpoint = process.env.AWS_S3_ENDPOINT || process.env.MINIO_ENDPOINT || undefined;

export const isS3Configured = !!(accessKeyId && secretAccessKey && s3BucketName);

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (!isS3Configured) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return s3Client;
}

export function buildObjectKey(sessionId: string, trackSid: string): string {
  return `recordings/session_${sessionId}/track_${trackSid}.webm`;
}

export type RenderPresetKey = "vertical_9_16" | "landscape_16_9" | "episode_mp3";

function renderSuffix(preset: RenderPresetKey): string {
  return preset === "vertical_9_16" ? "9x16" : preset === "landscape_16_9" ? "16x9" : "episode";
}

function renderExtension(preset: RenderPresetKey): string {
  return preset === "episode_mp3" ? "mp3" : "mp4";
}

export function buildClipRenderKey(
  sessionId: string,
  clipId: string,
  preset: RenderPresetKey,
): string {
  const suffix = renderSuffix(preset);
  const ext = renderExtension(preset);
  return `recordings/session_${sessionId}/renders/clip_${clipId}_${suffix}.${ext}`;
}

/** Full-session export (no clip trim). */
export function buildSessionRenderKey(
  sessionId: string,
  preset: "landscape_16_9" | "episode_mp3",
): string {
  const suffix = renderSuffix(preset);
  const ext = renderExtension(preset);
  return `recordings/session_${sessionId}/renders/session_${suffix}.${ext}`;
}

export function parseS3KeyFromReference(reference: string): string {
  if (!reference.startsWith("http")) return reference;
  try {
    const url = new URL(reference);
    const path = url.pathname.replace(/^\//, "");
    const bucketPrefix = `${s3BucketName}/`;
    if (path.startsWith(bucketPrefix)) return path.slice(bucketPrefix.length);
    const segments = path.split("/");
    if (segments[0] === s3BucketName) return segments.slice(1).join("/");
    return path;
  } catch {
    return reference;
  }
}

export async function getSignedGetUrl(key: string, expiresIn = 3600): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;
  const command = new GetObjectCommand({ Bucket: s3BucketName, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function resolveMediaFetchUrl(reference: string): Promise<string> {
  const key = parseS3KeyFromReference(reference);
  if (!isS3Configured) {
    return reference.startsWith("http") ? reference : `/mock-uploads/${key}`;
  }
  const signed = await getSignedGetUrl(key);
  return signed ?? reference;
}

export async function uploadObjectFromFile(params: {
  key: string;
  filePath: string;
  contentType?: string;
}): Promise<void> {
  const client = getS3Client();
  if (!client) {
    throw new Error("S3 is not configured — cannot upload rendered media");
  }
  const body = await readFile(params.filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: s3BucketName,
      Key: params.key,
      Body: body,
      ContentType: params.contentType ?? "video/mp4",
    }),
  );
}
