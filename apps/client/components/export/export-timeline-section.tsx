"use client";

import type { useExportTimeline } from "@/lib/hooks/use-export-timeline";

import { ExportTrackPreview } from "@/components/editor/export-track-preview";
import { TimelineLite } from "@/components/editor/timeline-lite";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";

type ExportTimelineSectionProps = {
  exportTimeline: ReturnType<typeof useExportTimeline>;
};

export function ExportTimelineSection({ exportTimeline }: ExportTimelineSectionProps) {
  if (!exportTimeline.hasTimeline) return null;

  return (
    <div className="space-y-4">
      <PanelTitle label="Visual rail" title="Timeline & preview" />
      <ExportTrackPreview
        videoUrl={exportTimeline.previewVideoUrl}
        playheadSec={exportTimeline.playheadSec}
        onPlayheadChange={exportTimeline.setPlayheadSec}
        durationSec={exportTimeline.durationSec}
      />
      <TimelineLite
        tracks={exportTimeline.timelineTracks}
        durationSec={exportTimeline.durationSec}
        playheadSec={exportTimeline.playheadSec}
        activeTrackId={exportTimeline.activeTrackId}
        trimByTrackId={exportTimeline.trimByTrackId}
        onPlayheadChange={exportTimeline.setPlayheadSec}
        onActiveTrackChange={exportTimeline.onActiveTrackChange}
        onTrimChange={exportTimeline.onTrimChange}
      />
      <MonoLabel className="text-muted-foreground/70 block text-[9px] leading-relaxed">
        Scrub the rail or drag trim handles on the active lane — values sync to the trim deck and
        preview video below.
      </MonoLabel>
    </div>
  );
}
