"use client";

import Link from "next/link";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { TranscriptEditor } from "@/components/editor/transcript-editor";
import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";
import { BookOpen } from "@/lib/icons";

type RecordingTranscriptSectionProps = {
  sessionId: string;
  transcriptSegments: NonNullable<SessionReviewBundle["transcriptSegments"]>;
  chapters: SessionReviewBundle["chapters"] | undefined;
};

export function RecordingTranscriptSection({
  sessionId,
  transcriptSegments,
  chapters,
}: RecordingTranscriptSectionProps) {
  if (transcriptSegments.length === 0) return null;

  return (
    <div className="space-y-4">
      {chapters && chapters.length > 0 ? (
        <AnalogCard className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="text-accent h-4 w-4" />
            <h3 className="text-sm font-bold tracking-wider uppercase">Chapters</h3>
          </div>
          <div className="space-y-1">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="border-border bg-popover flex items-center gap-3 rounded border px-3 py-2"
              >
                <MonoLabel className="text-accent shrink-0">
                  {formatTimestamp(ch.startTime)}
                </MonoLabel>
                <span className="text-foreground font-mono text-xs">{ch.title}</span>
              </div>
            ))}
          </div>
        </AnalogCard>
      ) : null}
      <TranscriptEditor segments={transcriptSegments} />
      <Link
        href={`/export/${sessionId}`}
        className="text-accent inline-block font-mono text-xs font-bold tracking-widest uppercase"
      >
        Open export console for text-based cuts →
      </Link>
    </div>
  );
}
