"use client";

import { useMutation } from "@tanstack/react-query";

import { AnalogInset } from "@/components/ui/analog-card";
import { MechButton, MonoLabel } from "@/components/ui/retro-primitives";
import { RefreshCw } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

type AiArtifactActionsProps = {
  sessionId: string;
  hasTranscript: boolean;
  transcriptStatus: string;
  pipeline: {
    transcript: { status: string };
    llm: { status: string };
    clips: { status: string };
  };
  onQueued?: () => void;
};

export function AiArtifactActions({
  sessionId,
  hasTranscript,
  transcriptStatus,
  pipeline,
  onQueued,
}: AiArtifactActionsProps) {
  const trpc = useTRPC();

  const regenerateLlm = useMutation(
    trpc.sessionReview.regenerateLlm.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  const regenerateClips = useMutation(
    trpc.clips.regenerate.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  const llmBusy = pipeline.llm.status === "processing";
  const clipsBusy = pipeline.clips.status === "processing";
  const transcriptReady = hasTranscript || transcriptStatus === "ready";

  const llmDisabled =
    !transcriptReady || llmBusy || regenerateLlm.isPending || transcriptStatus === "queued";
  const clipsDisabled = !transcriptReady || llmBusy || clipsBusy || regenerateClips.isPending;

  return (
    <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <MonoLabel className="sm:w-full">Regenerate AI artifacts</MonoLabel>
      <MechButton
        type="button"
        disabled={llmDisabled}
        onClick={() => regenerateLlm.mutate({ sessionId })}
        className="inline-flex items-center gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${regenerateLlm.isPending ? "animate-spin" : ""}`} />
        {regenerateLlm.isPending ? "Queueing…" : "Chapters & show notes"}
      </MechButton>
      <MechButton
        type="button"
        disabled={clipsDisabled}
        onClick={() => regenerateClips.mutate({ sessionId })}
        className="inline-flex items-center gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${regenerateClips.isPending ? "animate-spin" : ""}`} />
        {regenerateClips.isPending ? "Queueing…" : "Clip candidates"}
      </MechButton>
      {regenerateLlm.error ? (
        <p className="text-led-on w-full font-mono text-[10px]">{regenerateLlm.error.message}</p>
      ) : null}
      {regenerateClips.error ? (
        <p className="text-led-on w-full font-mono text-[10px]">{regenerateClips.error.message}</p>
      ) : null}
    </AnalogInset>
  );
}
