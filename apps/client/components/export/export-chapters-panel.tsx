"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

type ExportChaptersPanelProps = {
  chapters: NonNullable<SessionReviewBundle["chapters"]>;
};

export function ExportChaptersPanel({ chapters }: ExportChaptersPanelProps) {
  if (chapters.length === 0) return null;

  return (
    <AnalogCard className="p-6">
      <PanelTitle label="AI producer" title="Chapters" />
      <div className="mt-3 space-y-1">
        {chapters.map((ch) => (
          <div
            key={ch.id}
            className="border-border bg-popover flex items-center gap-3 rounded border px-3 py-2"
          >
            <MonoLabel className="text-accent shrink-0">{formatTimestamp(ch.startTime)}</MonoLabel>
            <span className="text-foreground font-mono text-xs">{ch.title}</span>
          </div>
        ))}
      </div>
    </AnalogCard>
  );
}
