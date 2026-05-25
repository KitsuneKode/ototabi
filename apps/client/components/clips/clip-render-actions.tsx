"use client";

import { useMutation } from "@tanstack/react-query";

import { MechButton } from "@/components/ui/retro-primitives";
import { Download } from "@/lib/icons";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useTRPC } from "@/trpc/client";
import { trpcClient } from "@/trpc/vanilla";

type ClipRenderActionsProps = {
  sessionId: string;
  clipId: string;
  renderStatus: string;
  renderS3Key: string | null;
  onQueued?: () => void;
};

export function ClipRenderActions({
  sessionId,
  clipId,
  renderStatus,
  renderS3Key,
  onQueued,
}: ClipRenderActionsProps) {
  const trpc = useTRPC();

  const queueClipRender = useMutation(
    trpc.clips.queueVerticalRender.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  const handleDownload = async () => {
    if (!renderS3Key) return;
    const url = await resolveTrackDownloadUrl(trpcClient, renderS3Key);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (renderStatus === "ready" && renderS3Key) {
    return (
      <MechButton
        type="button"
        onClick={() => void handleDownload()}
        className="inline-flex items-center gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Download 9:16
      </MechButton>
    );
  }

  if (renderStatus === "processing") {
    return (
      <MechButton type="button" disabled className="opacity-60">
        Rendering 9:16…
      </MechButton>
    );
  }

  if (renderStatus === "failed") {
    return (
      <MechButton
        type="button"
        disabled={queueClipRender.isPending}
        onClick={() => queueClipRender.mutate({ sessionId, clipId })}
      >
        Retry 9:16 export
      </MechButton>
    );
  }

  return (
    <MechButton
      type="button"
      disabled={queueClipRender.isPending}
      onClick={() => queueClipRender.mutate({ sessionId, clipId })}
    >
      {queueClipRender.isPending ? "Queueing…" : "Queue 9:16 export"}
    </MechButton>
  );
}
