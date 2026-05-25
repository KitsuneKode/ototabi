"use client";

import { useMutation } from "@tanstack/react-query";

import { MechButton } from "@/components/ui/retro-primitives";
import { Download } from "@/lib/icons";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useTRPC } from "@/trpc/client";
import { trpcClient } from "@/trpc/vanilla";

type SessionExportSlot = {
  status: string;
  s3Key: string | null;
  error: string | null;
};

type SessionExportActionsProps = {
  sessionId: string;
  preset: "episode_mp3" | "landscape_16_9";
  label: string;
  downloadLabel: string;
  exportSlot: SessionExportSlot;
  onQueued?: () => void;
};

export function SessionExportActions({
  sessionId,
  preset,
  label,
  downloadLabel,
  exportSlot,
  onQueued,
}: SessionExportActionsProps) {
  const trpc = useTRPC();

  const queueExport = useMutation(
    trpc.sessionReview.queueSessionExport.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  const handleDownload = async () => {
    if (!exportSlot.s3Key) return;
    const url = await resolveTrackDownloadUrl(trpcClient, exportSlot.s3Key);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (exportSlot.status === "ready" && exportSlot.s3Key) {
    return (
      <MechButton
        type="button"
        onClick={() => void handleDownload()}
        className="inline-flex items-center gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        {downloadLabel}
      </MechButton>
    );
  }

  if (exportSlot.status === "processing") {
    return (
      <MechButton type="button" disabled className="opacity-60">
        Rendering {label}…
      </MechButton>
    );
  }

  if (exportSlot.status === "failed") {
    return (
      <div className="flex flex-col items-end gap-1">
        {exportSlot.error ? (
          <p className="text-led-on max-w-xs text-right font-mono text-[9px] leading-snug">
            {exportSlot.error}
          </p>
        ) : null}
        <MechButton
          type="button"
          disabled={queueExport.isPending}
          onClick={() => queueExport.mutate({ sessionId, preset })}
        >
          Retry {label}
        </MechButton>
      </div>
    );
  }

  return (
    <MechButton
      type="button"
      disabled={queueExport.isPending}
      onClick={() => queueExport.mutate({ sessionId, preset })}
    >
      {queueExport.isPending ? "Queueing…" : `Queue ${label}`}
    </MechButton>
  );
}
