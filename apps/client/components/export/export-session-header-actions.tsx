"use client";

import type {
  ExportProcessingMode,
  ExportProcessingStatus,
} from "@/lib/stores/export-console-store";

import { Led } from "@/components/ui/led";
import { MechButton, StatusBadge } from "@/components/ui/retro-primitives";
import { exportProcIndicator } from "@/lib/export/export-proc-indicator";
import { ArrowLeft } from "@/lib/icons";

type ExportSessionHeaderActionsProps = {
  onBack: () => void;
  processingStatus: ExportProcessingStatus;
  processingMode: ExportProcessingMode;
  progress: number;
};

export function ExportSessionHeaderActions({
  onBack,
  processingStatus,
  processingMode,
  progress,
}: ExportSessionHeaderActionsProps) {
  const { procColor, procLabel } = exportProcIndicator(processingStatus, processingMode, progress);

  return (
    <>
      <MechButton onClick={onBack} className="h-9 px-2.5 py-2" aria-label="Back to dashboard">
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </MechButton>
      <div className="flex items-center gap-3">
        <Led
          color={procColor}
          size="sm"
          pulse={processingStatus === "processing" || processingStatus === "loading-ffmpeg"}
        />
        <StatusBadge
          variant={
            processingStatus === "processing" || processingStatus === "loading-ffmpeg"
              ? "warn"
              : processingStatus === "done"
                ? "ok"
                : processingStatus === "error"
                  ? "recording"
                  : "default"
          }
        >
          {procLabel}
        </StatusBadge>
      </div>
    </>
  );
}
