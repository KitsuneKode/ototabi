"use client";

import { useMutation } from "@tanstack/react-query";

import { MechButton } from "@/components/ui/retro-primitives";
import { RefreshCw } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

type TranscriptRetryActionsProps = {
  sessionId: string;
  transcriptStatus: "none" | "queued" | "ready" | "waiting_upload" | "failed" | "skipped";
  onQueued?: () => void;
};

export function TranscriptRetryActions({
  sessionId,
  transcriptStatus,
  onQueued,
}: TranscriptRetryActionsProps) {
  const trpc = useTRPC();

  const retryTranscript = useMutation(
    trpc.sessionReview.retryTranscript.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  if (transcriptStatus === "ready" || transcriptStatus === "skipped") return null;

  if (transcriptStatus === "failed") {
    return (
      <MechButton
        type="button"
        disabled={retryTranscript.isPending}
        onClick={() => retryTranscript.mutate({ sessionId })}
        className="inline-flex items-center gap-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {retryTranscript.isPending ? "Queueing…" : "Retry failed transcript"}
      </MechButton>
    );
  }

  if (transcriptStatus === "queued") {
    return (
      <MechButton type="button" disabled className="opacity-60">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Transcript processing…
      </MechButton>
    );
  }

  if (transcriptStatus === "waiting_upload") {
    return (
      <p className="text-muted-foreground font-mono text-[10px]">
        Waiting for microphone upload before transcript can run.
      </p>
    );
  }

  return (
    <MechButton
      type="button"
      disabled={retryTranscript.isPending}
      onClick={() => retryTranscript.mutate({ sessionId })}
      className="inline-flex items-center gap-1.5"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      {retryTranscript.isPending ? "Queueing…" : "Retry transcript"}
    </MechButton>
  );
}
