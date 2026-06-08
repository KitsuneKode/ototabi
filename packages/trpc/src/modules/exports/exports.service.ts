import type { Archiver } from "archiver";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  getS3Client,
  getSignedGetUrl,
  isS3Configured,
  parseS3KeyFromReference,
  s3BucketName,
  uploadObjectFromFile,
} from "@ototabi/backend-common/s3-media";
import { TRPCError } from "@trpc/server";
import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finished } from "node:stream/promises";

import type { CreateExportBundleResult, ExportableAssetDto } from "./exports.dto";

import { buildTranscriptJson, mapExportableAssets } from "./exports.mapper";
import { exportsPolicy } from "./exports.policy";
import { exportsRepository } from "./exports.repository";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver") as {
  ZipArchive: new (options?: { zlib?: { level?: number } }) => Archiver;
};

const s3Client = getS3Client();

async function assertCanViewSession(actorId: string, sessionId: string) {
  const session = await exportsRepository.findSessionForActor(sessionId, actorId);
  if (!exportsPolicy.canViewSession(session)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
  }
  return session;
}

async function downloadObjectBytes(key: string): Promise<Buffer> {
  if (!s3Client || !isS3Configured) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "S3/MinIO is not configured — cannot build ZIP bundles",
    });
  }
  const response = await s3Client.send(new GetObjectCommand({ Bucket: s3BucketName, Key: key }));
  const body = response.Body;
  if (!body || typeof body.transformToByteArray !== "function") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not read object from storage",
    });
  }
  return Buffer.from(await body.transformToByteArray());
}

async function signedUrlForKey(key: string): Promise<string> {
  const objectKey = parseS3KeyFromReference(key);
  if (!isS3Configured) {
    return `/mock-uploads/${objectKey}`;
  }
  const url = await getSignedGetUrl(objectKey);
  if (!url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not generate download URL",
    });
  }
  return url;
}

function resolveAssetFilename(asset: ExportableAssetDto): string {
  return asset.filename ?? `${asset.id.replace(/:/g, "_")}.bin`;
}

async function resolveAssetBytes(
  asset: ExportableAssetDto,
  sessionId: string,
  transcriptSegments: Awaited<
    ReturnType<typeof exportsRepository.loadExportContext>
  >["transcriptSegments"],
): Promise<Buffer> {
  if (asset.kind === "transcript_json") {
    return Buffer.from(buildTranscriptJson(sessionId, transcriptSegments), "utf8");
  }
  if (!asset.s3Key) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Asset ${asset.id} has no storage key`,
    });
  }
  return downloadObjectBytes(parseS3KeyFromReference(asset.s3Key));
}

async function buildZipArchive(
  entries: Array<{ filename: string; body: Buffer }>,
  outPath: string,
): Promise<void> {
  await mkdir(join(outPath, ".."), { recursive: true });
  const output = createWriteStream(outPath);
  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.pipe(output);
  for (const entry of entries) {
    archive.append(entry.body, { name: entry.filename });
  }
  archive.finalize();
  await Promise.all([finished(archive), finished(output)]);
}

function bundleObjectKey(sessionId: string): string {
  return `recordings/session_${sessionId}/bundles/export_${Date.now()}.zip`;
}

export const exportsService = {
  async listExportableAssets(params: { actorId: string; sessionId: string }) {
    const session = await assertCanViewSession(params.actorId, params.sessionId);
    const ctx = await exportsRepository.loadExportContext(params.sessionId);
    return { assets: mapExportableAssets(session, ctx) };
  },

  async createExportBundle(params: {
    actorId: string;
    sessionId: string;
    assetIds: string[];
    asZip?: boolean;
  }): Promise<CreateExportBundleResult> {
    const session = await assertCanViewSession(params.actorId, params.sessionId);
    const ctx = await exportsRepository.loadExportContext(params.sessionId);
    const allAssets = mapExportableAssets(session, ctx);

    const gate = exportsPolicy.canBundleAssets(allAssets, params.assetIds);
    if (!gate.ok) {
      const parts: string[] = [];
      if (gate.unknownIds.length > 0) {
        parts.push(`Unknown assets: ${gate.unknownIds.join(", ")}`);
      }
      if (gate.notReadyIds.length > 0) {
        parts.push(`Not ready: ${gate.notReadyIds.join(", ")}`);
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: parts.join(". ") || "Selected assets are not ready",
      });
    }

    const selected = allAssets.filter((a) => params.assetIds.includes(a.id));

    const assetResults: CreateExportBundleResult["assets"] = params.asZip
      ? []
      : (
          await Promise.all(
            selected.map(async (asset) => {
              if (asset.kind === "transcript_json") {
                const json = buildTranscriptJson(params.sessionId, ctx.transcriptSegments);
                if (!isS3Configured) {
                  return {
                    id: asset.id,
                    filename: "transcript.json",
                    downloadUrl: `data:application/json;charset=utf-8,${encodeURIComponent(json)}`,
                  };
                }
                const key = `recordings/session_${params.sessionId}/bundles/transcript_${Date.now()}.json`;
                const tmpDir = join(tmpdir(), `ototabi-export-${params.sessionId}-${Date.now()}`);
                await mkdir(tmpDir, { recursive: true });
                const tmpFile = join(tmpDir, "transcript.json");
                try {
                  await writeFile(tmpFile, json, "utf8");
                  await uploadObjectFromFile({
                    key,
                    filePath: tmpFile,
                    contentType: "application/json",
                  });
                  return {
                    id: asset.id,
                    filename: "transcript.json",
                    downloadUrl: await signedUrlForKey(key),
                  };
                } finally {
                  await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
                }
              }
              if (!asset.s3Key) return null;
              return {
                id: asset.id,
                filename: resolveAssetFilename(asset),
                downloadUrl: await signedUrlForKey(asset.s3Key),
              };
            }),
          )
        ).filter((row): row is CreateExportBundleResult["assets"][number] => row != null);

    let zipDownloadUrl: string | null = null;

    if (params.asZip) {
      const zipEntries = await Promise.all(
        selected.map(async (asset) => ({
          filename: resolveAssetFilename(asset),
          body: await resolveAssetBytes(asset, params.sessionId, ctx.transcriptSegments),
        })),
      );

      const tmpDir = join(tmpdir(), `ototabi-bundle-${params.sessionId}-${Date.now()}`);
      await mkdir(tmpDir, { recursive: true });
      const zipPath = join(tmpDir, "bundle.zip");

      try {
        await buildZipArchive(zipEntries, zipPath);
        const key = bundleObjectKey(params.sessionId);

        if (!isS3Configured) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Configure MinIO/S3 to download ZIP bundles",
          });
        }

        await uploadObjectFromFile({
          key,
          filePath: zipPath,
          contentType: "application/zip",
        });
        zipDownloadUrl = await signedUrlForKey(key);
      } finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      }
    }

    return { assets: assetResults, zipDownloadUrl };
  },
};
