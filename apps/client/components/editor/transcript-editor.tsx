"use client";

import { useCallback, useMemo, useState } from "react";

import type { CutPreviewSummary } from "@/lib/cut-preview";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

export type TranscriptSegmentRow = {
  id?: string;
  startTime: number;
  endTime: number;
  text: string;
};

export function TranscriptEditor({
  segments,
  onPreviewRange,
  cutSegmentIds,
  onToggleCutSegment,
  previewRange,
  cutPreviewSummary,
  onPreviewSelectedCuts,
}: {
  segments: TranscriptSegmentRow[];
  onPreviewRange?: (startTime: number, endTime: number) => void;
  /** When set, segment clicks toggle cut marks instead of single-select preview. */
  cutSegmentIds?: string[];
  onToggleCutSegment?: (segmentId: string) => void;
  previewRange?: { startTime: number; endTime: number } | null;
  cutPreviewSummary?: CutPreviewSummary | null;
  onPreviewSelectedCuts?: () => void;
}) {
  const cutMode = Boolean(onToggleCutSegment);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? segments[selectedIndex] : null;

  const handleSelect = useCallback(
    (index: number) => {
      const seg = segments[index];
      if (cutMode && seg?.id && onToggleCutSegment) {
        onToggleCutSegment(seg.id);
        return;
      }
      setSelectedIndex(index);
      if (seg && onPreviewRange) {
        onPreviewRange(seg.startTime, seg.endTime);
      }
    },
    [cutMode, onToggleCutSegment, onPreviewRange, segments],
  );

  const handlePreview = useCallback(() => {
    if (!selected || !onPreviewRange) return;
    onPreviewRange(selected.startTime, selected.endTime);
  }, [selected, onPreviewRange]);

  const wordCount = useMemo(
    () => segments.reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0),
    [segments],
  );

  if (segments.length === 0) {
    return (
      <AnalogInset className="p-6 text-center">
        <MonoLabel>
          Transcript pending — worker will fill segments after upload completes.
        </MonoLabel>
      </AnalogInset>
    );
  }

  return (
    <AnalogCard className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <PanelTitle label="Text edit rail" title="Transcript editor" />
        <MonoLabel>
          {segments.length} segments &bull; {wordCount} words
        </MonoLabel>
      </div>

      <div className="grid max-h-[320px] grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
        {segments.map((seg, index) => {
          const isCut = seg.id ? (cutSegmentIds?.includes(seg.id) ?? false) : false;
          const inCutPreviewEnvelope =
            cutPreviewSummary?.previewEnvelope &&
            seg.endTime >= cutPreviewSummary.previewEnvelope.startTime &&
            seg.startTime <= cutPreviewSummary.previewEnvelope.endTime;
          const inManualPreview =
            previewRange &&
            seg.endTime >= previewRange.startTime &&
            seg.startTime <= previewRange.endTime;
          const inPreview = inCutPreviewEnvelope || inManualPreview;
          return (
            <button
              key={seg.id ?? `${seg.startTime}-${index}`}
              type="button"
              onClick={() => handleSelect(index)}
              className={`border-border rounded border p-3 text-left transition-colors ${
                isCut
                  ? "border-led-on/30 bg-led-on/10 line-through opacity-60"
                  : inPreview
                    ? "border-accent bg-accent/10"
                    : selectedIndex === index && !cutMode
                      ? "border-accent bg-accent/5"
                      : "bg-card hover:border-accent/30"
              }`}
            >
              <MonoLabel className="text-[9px]">
                {formatTimestamp(seg.startTime)} – {formatTimestamp(seg.endTime)}
              </MonoLabel>
              <p className="text-foreground mt-2 font-mono text-xs leading-relaxed">{seg.text}</p>
            </button>
          );
        })}
      </div>

      {cutMode && cutPreviewSummary ? (
        <AnalogInset className="space-y-2 p-4">
          <MonoLabel className="block">Cut preview (before apply)</MonoLabel>
          <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
            Removing {cutPreviewSummary.cutCount} segment
            {cutPreviewSummary.cutCount !== 1 ? "s" : ""} (
            {formatTimestamp(cutPreviewSummary.removedSeconds)} total) — keeping{" "}
            {cutPreviewSummary.keepRanges.length} slice
            {cutPreviewSummary.keepRanges.length !== 1 ? "s" : ""} (
            {formatTimestamp(cutPreviewSummary.keptSeconds)}).
          </p>
          {onPreviewSelectedCuts ? (
            <button
              type="button"
              onClick={onPreviewSelectedCuts}
              className="btn-mechanical text-secondary-foreground rounded px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase"
            >
              Highlight removal envelope
            </button>
          ) : null}
        </AnalogInset>
      ) : null}

      {selected && !cutMode ? (
        <AnalogInset className="p-4">
          <MonoLabel className="mb-2 block">Preview selection</MonoLabel>
          <p className="text-muted-foreground mb-3 font-mono text-xs leading-relaxed">
            {selected.text}
          </p>
          {onPreviewRange ? (
            <button
              type="button"
              onClick={handlePreview}
              className="btn-mechanical text-secondary-foreground rounded px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase"
            >
              Preview cut range
            </button>
          ) : null}
        </AnalogInset>
      ) : null}
    </AnalogCard>
  );
}
