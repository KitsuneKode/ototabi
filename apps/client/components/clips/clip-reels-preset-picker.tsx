"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { MechButton, MonoLabel } from "@/components/ui/retro-primitives";
import { useTRPC } from "@/trpc/client";

type ClipReelsPresetPickerProps = {
  sessionId: string;
  clipId: string;
  onQueued?: () => void;
};

export function ClipReelsPresetPicker({ sessionId, clipId, onQueued }: ClipReelsPresetPickerProps) {
  const trpc = useTRPC();

  const presetsQuery = useQuery(trpc.clips.listReelsPresets.queryOptions());

  const queueReelsRender = useMutation(
    trpc.clips.queueReelsRender.mutationOptions({
      onSuccess: () => onQueued?.(),
    }),
  );

  const presets = presetsQuery.data ?? [];
  const pendingId = queueReelsRender.isPending ? queueReelsRender.variables?.reelsPresetId : null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <MonoLabel className="text-muted-foreground text-[9px]">Reels preset</MonoLabel>
      <div className="flex flex-wrap justify-end gap-1.5">
        {presets.map((preset) => (
          <MechButton
            key={preset.id}
            type="button"
            disabled={queueReelsRender.isPending}
            onClick={() =>
              queueReelsRender.mutate({
                sessionId,
                clipId,
                reelsPresetId: preset.id,
              })
            }
            className="text-[10px]"
          >
            {pendingId === preset.id ? "Applying…" : preset.label}
          </MechButton>
        ))}
      </div>
    </div>
  );
}
