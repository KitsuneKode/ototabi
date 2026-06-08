"use client";

import type { SessionReviewBundle } from "@/lib/trpc/router-types";

import { SessionExportActions } from "@/components/clips/session-export-actions";
import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";

type ExportWorkerExportsPanelProps = {
  sessionId: string;
  exports: NonNullable<SessionReviewBundle["exports"]>;
  onQueued: () => void;
};

export function ExportWorkerExportsPanel({
  sessionId,
  exports,
  onQueued,
}: ExportWorkerExportsPanelProps) {
  return (
    <div className="space-y-4">
      <PanelTitle label="Cloud worker" title="Full-session exports" />
      <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <MonoLabel>Episode MP3</MonoLabel>
        <SessionExportActions
          sessionId={sessionId}
          preset="episode_mp3"
          label="episode MP3"
          downloadLabel="Download MP3"
          exportSlot={exports.episodeMp3}
          onQueued={onQueued}
        />
      </AnalogInset>
      <AnalogInset className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <MonoLabel>Landscape 16:9</MonoLabel>
        <SessionExportActions
          sessionId={sessionId}
          preset="landscape_16_9"
          label="landscape"
          downloadLabel="Download 16:9"
          exportSlot={exports.landscape}
          onQueued={onQueued}
        />
      </AnalogInset>
    </div>
  );
}
