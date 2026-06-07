import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { AlertTriangle, Scissors } from "@/lib/icons";

type BrowserExportPanelProps = {
  completedTracks: any[];
  trimTrackId: string | null;
  setTrimTrackId: (id: string | null) => void;
  trimStart: string;
  setTrimStart: (val: string) => void;
  trimEnd: string;
  setTrimEnd: (val: string) => void;
  handleTrim: () => void;
  processingStatus: string;
  processingMode: string | null;
  errorMessage: string;
};

export function BrowserExportPanel({
  completedTracks,
  trimTrackId,
  setTrimTrackId,
  trimStart,
  setTrimStart,
  trimEnd,
  setTrimEnd,
  handleTrim,
  processingStatus,
  processingMode,
  errorMessage,
}: BrowserExportPanelProps) {
  return (
    <AnalogCard className="p-6">
      <PanelTitle label="Splicing Deck" title="Trim Clip" className="mb-5" />

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
        <AnalogInset className="p-3">
          <MonoLabel as="label" htmlFor="trim-track" className="mb-1.5 block">
            Select Track
          </MonoLabel>
          <select
            id="trim-track"
            value={trimTrackId ?? ""}
            onChange={(e) => setTrimTrackId(e.target.value || null)}
            className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs uppercase focus:outline-none"
          >
            <option value="">— Select —</option>
            {completedTracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.type} — {t.user?.name ?? "Unknown"}
              </option>
            ))}
          </select>
        </AnalogInset>

        <AnalogInset className="p-3">
          <MonoLabel as="label" htmlFor="trim-start" className="mb-1.5 block">
            Skip Start (s)
          </MonoLabel>
          <input
            id="trim-start"
            type="number"
            min="0"
            step="0.5"
            value={trimStart}
            onChange={(e) => setTrimStart(e.target.value)}
            placeholder="0"
            className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none"
          />
        </AnalogInset>

        <AnalogInset className="p-3">
          <MonoLabel as="label" htmlFor="trim-end" className="mb-1.5 block">
            End Time (s)
          </MonoLabel>
          <input
            id="trim-end"
            type="number"
            min="0"
            step="0.5"
            value={trimEnd}
            onChange={(e) => setTrimEnd(e.target.value)}
            placeholder="0"
            className="bg-card border-border focus:border-accent w-full rounded border px-2 py-1.5 font-mono text-xs tabular-nums focus:outline-none"
          />
        </AnalogInset>
      </div>

      <MechButton
        onClick={handleTrim}
        disabled={
          !trimTrackId ||
          (!trimStart && !trimEnd) ||
          processingStatus === "processing" ||
          processingStatus === "loading-ffmpeg"
        }
        className="mt-4 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Scissors className="h-3.5 w-3.5" />
        Apply Trim
      </MechButton>

      {errorMessage && processingMode === "trim" && (
        <div className="border-led-on/30 bg-led-on/5 mt-4 flex items-start gap-2 rounded border p-3">
          <AlertTriangle className="text-led-on mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-led-on font-mono text-[10px] leading-relaxed">{errorMessage}</p>
        </div>
      )}
    </AnalogCard>
  );
}
