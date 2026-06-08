"use client";

import type { StudioConnectionUiStatus } from "@ototabi/trpc/studio-health";

import { StudioHealthParticipantRow } from "@/components/studio/studio-health-participant-row";
import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { useStudioHealthRows } from "@/lib/hooks/use-studio-health-rows";

export type StudioUploadProgressRow = {
  name: string;
  progress: number;
  uploadedParts?: number;
  totalParts?: number;
};

type StudioHealthPanelProps = {
  roomDbId: string;
  localUserId: string;
  localUserEmail?: string | null;
  localRole?: string;
  isRecording: boolean;
  localConnectionHealth: StudioConnectionUiStatus;
  uploadProgress: StudioUploadProgressRow[];
  micDeviceId?: string;
  camDeviceId?: string;
};

export function StudioHealthPanel(props: StudioHealthPanelProps) {
  const { rows, localPendingTracks, healthQueryIsError } = useStudioHealthRows(props);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <PanelTitle
        label="Diagnostics"
        title="Session health"
        className="border-border mb-4 border-b pb-3"
      />

      {healthQueryIsError ? (
        <AnalogInset className="p-3">
          <MonoLabel className="text-[9px] text-yellow-600 dark:text-yellow-400">
            Health snapshot unavailable
          </MonoLabel>
        </AnalogInset>
      ) : null}

      {rows.length === 0 ? (
        <AnalogInset className="border-dashed p-6 text-center">
          <MonoLabel className="text-[9px]">Waiting for participants…</MonoLabel>
        </AnalogInset>
      ) : (
        <ul className="space-y-3" aria-label="Per-participant session health">
          {rows.map((row) => (
            <StudioHealthParticipantRow
              key={row.key}
              row={row}
              localPendingTracks={localPendingTracks}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
