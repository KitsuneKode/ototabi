import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { DEMO_ASPECT_LABELS } from "@/lib/demo/demo-export-presets";
import { AlertTriangle, Combine, Download } from "@/lib/icons";

type ExportProcessingPanelProps = {
  syncAlignmentWarnings: string[];
  errorMessage: string;
  processingMode: string | null;
  processingStatus: string;
  progress: number;
  noiseReduction: boolean;
  setNoiseReduction: (val: boolean) => void;
  selectedTrackIds: string[];
  sessionMode: string | undefined;
  handleMerge: () => void;
  handleExportRes: (res: "720p" | "1080p") => void;
  handleDemoAspectExport: (preset: any) => void;
};

export function ExportProcessingPanel({
  syncAlignmentWarnings,
  errorMessage,
  processingMode,
  processingStatus,
  progress,
  noiseReduction,
  setNoiseReduction,
  selectedTrackIds,
  sessionMode,
  handleMerge,
  handleExportRes,
  handleDemoAspectExport,
}: ExportProcessingPanelProps) {
  return (
    <AnalogCard className="p-6">
      <PanelTitle label="Mastering Suite" title="Merge & Export" className="mb-5" />

      {syncAlignmentWarnings.map((warning) => (
        <div
          key={`merge-${warning}`}
          className="border-led-on/30 bg-led-on/5 mb-4 flex items-start gap-2 rounded border p-3"
        >
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{warning}</p>
        </div>
      ))}

      {errorMessage && !processingMode && (
        <div className="border-led-on/30 bg-led-on/5 mb-4 flex items-start gap-2 rounded border p-3">
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="border-border bg-popover hover:border-accent/30 flex cursor-pointer items-center gap-3 rounded border px-4 py-2.5 transition-colors">
          <input
            type="checkbox"
            checked={noiseReduction}
            onChange={(e) => setNoiseReduction(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          <div>
            <MonoLabel className="text-foreground block">Noise Reduction</MonoLabel>
            <MonoLabel className="text-muted-foreground/60 text-[9px]">
              Apply afftdn filter for cleaner audio
            </MonoLabel>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MechButton
          onClick={handleMerge}
          disabled={
            selectedTrackIds.length < 2 ||
            processingStatus === "processing" ||
            processingStatus === "loading-ffmpeg"
          }
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Combine className="h-3.5 w-3.5" />
          Merge Selected Tracks
        </MechButton>

        <MechButton
          onClick={() => handleExportRes("720p")}
          disabled={
            selectedTrackIds.length === 0 ||
            processingStatus === "processing" ||
            processingStatus === "loading-ffmpeg"
          }
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export 720p
        </MechButton>

        <MechButton
          onClick={() => handleExportRes("1080p")}
          disabled={
            selectedTrackIds.length === 0 ||
            processingStatus === "processing" ||
            processingStatus === "loading-ffmpeg"
          }
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export 1080p
        </MechButton>

        {sessionMode === "DEMO" ? (
          <>
            <MechButton
              onClick={() => handleDemoAspectExport("16:9")}
              disabled={
                selectedTrackIds.length === 0 ||
                processingStatus === "processing" ||
                processingStatus === "loading-ffmpeg"
              }
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              {DEMO_ASPECT_LABELS["16:9"]}
            </MechButton>
            <MechButton
              onClick={() => handleDemoAspectExport("9:16")}
              disabled={
                selectedTrackIds.length === 0 ||
                processingStatus === "processing" ||
                processingStatus === "loading-ffmpeg"
              }
              className="disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              {DEMO_ASPECT_LABELS["9:16"]}
            </MechButton>
          </>
        ) : null}
      </div>

      {(processingStatus === "processing" || processingStatus === "loading-ffmpeg") && (
        <div className="mt-5">
          <AnalogInset className="flex h-2 items-stretch p-0.5">
            <div
              className="rounded-sm transition-all duration-300"
              style={{
                width: `${processingStatus === "loading-ffmpeg" ? 30 : progress}%`,
                backgroundColor: "var(--accent)",
              }}
            />
          </AnalogInset>
        </div>
      )}
    </AnalogCard>
  );
}
