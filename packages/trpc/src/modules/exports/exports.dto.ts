import { z } from "zod";

export const exportAssetIdSchema = z.string().min(1);

export const listExportableAssetsSchema = z.object({
  sessionId: z.string().min(1),
});

export const createExportBundleSchema = z.object({
  sessionId: z.string().min(1),
  assetIds: z.array(exportAssetIdSchema).min(1),
  /** When true, assemble a ZIP on the server and return a single download URL. */
  asZip: z.boolean().optional().default(false),
});

export type ExportAssetStatus = "pending" | "processing" | "ready" | "unavailable";

export type ExportAssetKind =
  | "track"
  | "session_episode_mp3"
  | "session_landscape"
  | "clip"
  | "transcript_json";

export type ExportableAssetDto = {
  id: string;
  kind: ExportAssetKind;
  label: string;
  status: ExportAssetStatus;
  filename: string | null;
  s3Key: string | null;
  error: string | null;
};

export type ExportBundleAssetResult = {
  id: string;
  filename: string;
  downloadUrl: string;
};

export type CreateExportBundleResult = {
  assets: ExportBundleAssetResult[];
  zipDownloadUrl: string | null;
};
