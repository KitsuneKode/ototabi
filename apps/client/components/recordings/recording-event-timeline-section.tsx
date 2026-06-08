"use client";

import type { SessionTimelineEvent } from "@/components/patterns/session-timeline";

import { SessionTimeline } from "@/components/patterns/session-timeline";
import { PanelTitle } from "@/components/ui/retro-primitives";

type RecordingEventTimelineSectionProps = {
  events: SessionTimelineEvent[] | undefined;
  isLoading: boolean;
};

export function RecordingEventTimelineSection({
  events,
  isLoading,
}: RecordingEventTimelineSectionProps) {
  return (
    <div className="space-y-4">
      <PanelTitle label="Event Tape" title="Recording Timeline" />
      <SessionTimeline events={events} isLoading={isLoading} />
    </div>
  );
}
