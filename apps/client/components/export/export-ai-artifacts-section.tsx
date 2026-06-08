"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { AiArtifactActions } from "@/components/session-review/ai-artifact-actions";
import { AiPipelineStatus } from "@/components/session-review/ai-pipeline-status";
import { ShowNotesEditor } from "@/components/session-review/show-notes-editor";

type ExportAiArtifactsSectionProps = {
  sessionId: string;
  pipeline: SessionReviewBundle["pipeline"] | undefined;
  aiStatus: SessionReviewBundle["aiStatus"] | undefined;
  transcriptStatus: SessionReviewBundle["transcriptStatus"] | undefined;
  transcriptSegments: SessionReviewBundle["transcriptSegments"] | undefined;
  showNotes: SessionReviewBundle["showNotes"] | undefined;
  onRefetch: () => void;
};

export function ExportAiArtifactsSection({
  sessionId,
  pipeline,
  aiStatus,
  transcriptStatus,
  transcriptSegments,
  showNotes,
  onRefetch,
}: ExportAiArtifactsSectionProps) {
  const hasTranscript = (transcriptSegments?.length ?? 0) > 0;

  return (
    <>
      {pipeline ? <AiPipelineStatus pipeline={pipeline} aiStatus={aiStatus ?? "pending"} /> : null}

      {hasTranscript && pipeline ? (
        <AiArtifactActions
          sessionId={sessionId}
          hasTranscript={hasTranscript}
          transcriptStatus={transcriptStatus ?? "none"}
          pipeline={pipeline}
          onQueued={onRefetch}
        />
      ) : null}

      {showNotes ? (
        <ShowNotesEditor sessionId={sessionId} showNotes={showNotes} onSaved={onRefetch} />
      ) : null}
    </>
  );
}
