"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { ClipRenderActions } from "@/components/clips/clip-render-actions";
import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatTimestamp } from "@/lib/date-utils";

type ExportClipsPanelProps = {
  sessionId: string;
  clipCandidates: NonNullable<SessionReviewBundle["clipCandidates"]>;
  onQueued: () => void;
};

export function ExportClipsPanel({ sessionId, clipCandidates, onQueued }: ExportClipsPanelProps) {
  if (clipCandidates.length === 0) return null;

  return (
    <div className="space-y-4">
      <PanelTitle label="Magic clips" title="Vertical clip pack" />
      <div className="space-y-3">
        {clipCandidates.map((clip) => (
          <AnalogInset key={clip.id} className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel>
                {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)} &bull; score{" "}
                {(clip.score * 100).toFixed(0)}%
              </MonoLabel>
              <ClipRenderActions
                sessionId={sessionId}
                clipId={clip.id}
                renderStatus={clip.renderStatus}
                renderS3Key={clip.renderS3Key}
                renderError={clip.renderError}
                onQueued={onQueued}
              />
            </div>
          </AnalogInset>
        ))}
      </div>
    </div>
  );
}
