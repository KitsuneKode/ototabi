"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { TranscriptRetryActions } from "@/components/session-review/transcript-retry-actions";
import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";

type RecordingTranscriptEmptyPanelProps = {
  sessionId: string;
  transcriptStatus: SessionReviewBundle["transcriptStatus"] | undefined;
  onQueued: () => void;
};

export function RecordingTranscriptEmptyPanel({
  sessionId,
  transcriptStatus,
  onQueued,
}: RecordingTranscriptEmptyPanelProps) {
  return (
    <AnalogCard className="flex flex-col items-center gap-4 p-8 text-center">
      <MonoLabel className="text-muted-foreground">
        No transcript yet. Stop a session with uploaded audio, Redis, worker, and OPENAI_API_KEY
        configured to generate one.
      </MonoLabel>
      {transcriptStatus ? (
        <TranscriptRetryActions
          sessionId={sessionId}
          transcriptStatus={transcriptStatus}
          onQueued={onQueued}
        />
      ) : null}
    </AnalogCard>
  );
}
