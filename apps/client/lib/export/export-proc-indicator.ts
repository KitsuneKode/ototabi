import type {
  ExportProcessingMode,
  ExportProcessingStatus,
} from "@/lib/stores/export-console-store";

export function exportProcIndicator(
  processingStatus: ExportProcessingStatus,
  processingMode: ExportProcessingMode,
  progress: number,
) {
  const procColor =
    processingStatus === "processing" || processingStatus === "loading-ffmpeg"
      ? ("amber" as const)
      : processingStatus === "done"
        ? ("green" as const)
        : processingStatus === "error"
          ? ("red" as const)
          : ("green-off" as const);

  const procLabel =
    processingStatus === "loading-ffmpeg"
      ? "LOADING FFMPEG"
      : processingStatus === "processing"
        ? `${processingMode?.toUpperCase()} ${progress}%`
        : processingStatus === "done"
          ? "COMPLETE"
          : processingStatus === "error"
            ? "ERROR"
            : "STANDBY";

  return { procColor, procLabel };
}
