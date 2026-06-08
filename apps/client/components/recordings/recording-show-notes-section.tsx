"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { ShowNotesEditor } from "@/components/session-review/show-notes-editor";
import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";

type RecordingShowNotesSectionProps = {
  sessionId: string;
  showNotes: SessionReviewBundle["showNotes"] | undefined;
  aiStatus: SessionReviewBundle["aiStatus"] | undefined;
  onSaved: () => void;
};

export function RecordingShowNotesSection({
  sessionId,
  showNotes,
  aiStatus,
  onSaved,
}: RecordingShowNotesSectionProps) {
  if (showNotes) {
    return <ShowNotesEditor sessionId={sessionId} showNotes={showNotes} onSaved={onSaved} />;
  }

  if (aiStatus === "processing") {
    return (
      <AnalogCard className="p-6 text-center">
        <MonoLabel>AI processing transcript, chapters, and clips…</MonoLabel>
      </AnalogCard>
    );
  }

  return null;
}
