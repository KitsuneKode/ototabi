import type { CutPreviewSummary } from "@/lib/cut-preview";
import type { TranscriptSegment, UsageGet } from "@/lib/trpc/router-types";

import { TranscriptEditor } from "@/components/editor/transcript-editor";
import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";
import { AlertTriangle, Scissors } from "@/lib/icons";

type TextEditPanelProps = {
  canTextEdit: boolean;
  usageData: UsageGet | undefined;
  checkoutIsPending: boolean;
  startProCheckout: () => void;
  transcriptSegments: TranscriptSegment[];
  cutSegmentIds: string[];
  toggleCutSegment: (id: string) => void;
  previewCutRange: { startTime: number; endTime: number } | null;
  cutPreviewSummary: CutPreviewSummary | null;
  setPreviewCutRange: (range: { startTime: number; endTime: number } | null) => void;
  handleCuts: () => void;
  processingStatus: string;
  processingMode: string | null;
  selectedTrackIds: string[];
  errorMessage: string;
};

export function TextEditPanel({
  canTextEdit,
  usageData,
  checkoutIsPending,
  startProCheckout,
  transcriptSegments,
  cutSegmentIds,
  toggleCutSegment,
  previewCutRange,
  cutPreviewSummary,
  setPreviewCutRange,
  handleCuts,
  processingStatus,
  processingMode,
  selectedTrackIds,
  errorMessage,
}: TextEditPanelProps) {
  return (
    <div className="space-y-4">
      <PanelTitle label="Pro feature" title="Text-based editing" />
      {!canTextEdit ? (
        <AnalogInset className="space-y-3 p-4">
          <p className="text-muted-foreground font-mono text-[11px] leading-relaxed">
            Cut and remove segments from the transcript requires a Pro plan or higher.
            {usageData?.effectivePlan === "TRIAL"
              ? " Trial includes one lifetime transcript; unlimited editing is on Pro."
              : null}
          </p>
          <MechButton
            type="button"
            onClick={startProCheckout}
            disabled={checkoutIsPending}
            className="w-full justify-center sm:w-auto"
          >
            Upgrade to Pro
          </MechButton>
        </AnalogInset>
      ) : null}
      <div
        className={
          canTextEdit ? "space-y-4" : "pointer-events-none space-y-4 opacity-50 select-none"
        }
      >
        <TranscriptEditor
          segments={transcriptSegments}
          cutSegmentIds={cutSegmentIds}
          onToggleCutSegment={toggleCutSegment}
          previewRange={previewCutRange}
          cutPreviewSummary={cutPreviewSummary}
          onPreviewSelectedCuts={() => {
            if (cutPreviewSummary?.previewEnvelope) {
              setPreviewCutRange(cutPreviewSummary.previewEnvelope);
            }
          }}
          onPreviewRange={(startTime, endTime) => setPreviewCutRange({ startTime, endTime })}
        />
        {cutPreviewSummary ? (
          <AnalogInset className="space-y-2 p-3">
            <MonoLabel className="text-[9px]">
              Will remove {formatTimestamp(cutPreviewSummary.removedSeconds)} — keep{" "}
              {cutPreviewSummary.keepRanges.length} segment
              {cutPreviewSummary.keepRanges.length !== 1 ? "s" : ""} (
              {formatTimestamp(cutPreviewSummary.keptSeconds)})
            </MonoLabel>
            {previewCutRange ? (
              <MonoLabel className="text-muted-foreground text-[9px]">
                Highlight {formatTimestamp(previewCutRange.startTime)} –{" "}
                {formatTimestamp(previewCutRange.endTime)}
              </MonoLabel>
            ) : null}
          </AnalogInset>
        ) : null}
        <MechButton
          onClick={handleCuts}
          disabled={
            !canTextEdit ||
            cutSegmentIds.length === 0 ||
            processingStatus === "processing" ||
            processingStatus === "loading-ffmpeg"
          }
          className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Scissors className="h-3.5 w-3.5" />
          Remove {cutSegmentIds.length} Selected Segment
          {cutSegmentIds.length !== 1 ? "s" : ""}
          {selectedTrackIds.length > 0
            ? ` (${selectedTrackIds.length} track${selectedTrackIds.length !== 1 ? "s" : ""})`
            : " (all completed tracks)"}
        </MechButton>
      </div>

      {errorMessage && processingMode === "cuts" ? (
        <div className="border-led-on/30 bg-led-on/5 flex items-start gap-2 rounded border p-3">
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
