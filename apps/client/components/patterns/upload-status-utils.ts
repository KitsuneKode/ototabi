export type UploadDisplayStatus =
  | "recording"
  | "finalizing"
  | "uploading"
  | "recoverable"
  | "failed"
  | "complete";

export function mapTrackStatusToUploadDisplay(
  status: string,
  hasPendingLocalChunks?: boolean,
): UploadDisplayStatus {
  if (hasPendingLocalChunks) return "recoverable";
  if (status === "COMPLETED") return "complete";
  if (status === "UPLOADING") return "uploading";
  if (status === "FAILED") return "failed";
  return "uploading";
}
