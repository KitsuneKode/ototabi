"use client";

import type { ZoomRegion } from "@/lib/demo/demo-types";

import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { Trash } from "@/lib/icons";

export function DemoZoomRegionList({
  regions,
  onUpdate,
  onRemove,
  onAdd,
}: {
  regions: ZoomRegion[];
  onUpdate: (id: string, patch: Partial<ZoomRegion>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <AnalogCard className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <PanelTitle label="Timeline" title="Zoom regions" />
        <MechButton type="button" onClick={onAdd} className="text-xs">
          Add region
        </MechButton>
      </div>

      {regions.length === 0 ? (
        <MonoLabel className="text-muted-foreground text-[10px]">
          No zoom regions — preview plays at 1×. Add a region to punch in on cursor path.
        </MonoLabel>
      ) : null}

      <ul className="space-y-3">
        {regions.map((region) => (
          <li
            key={region.id}
            className="border-border grid gap-3 rounded border p-3 sm:grid-cols-4"
          >
            <label className="block">
              <MonoLabel className="mb-1 block text-[9px]">Start (ms)</MonoLabel>
              <input
                type="number"
                min={0}
                value={region.startMs}
                onChange={(e) => onUpdate(region.id, { startMs: Number(e.target.value) || 0 })}
                className="bg-card border-border w-full rounded border px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="block">
              <MonoLabel className="mb-1 block text-[9px]">End (ms)</MonoLabel>
              <input
                type="number"
                min={0}
                value={region.endMs}
                onChange={(e) => onUpdate(region.id, { endMs: Number(e.target.value) || 0 })}
                className="bg-card border-border w-full rounded border px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="block">
              <MonoLabel className="mb-1 block text-[9px]">Scale</MonoLabel>
              <input
                type="number"
                min={1}
                max={4}
                step={0.1}
                value={region.scale}
                onChange={(e) =>
                  onUpdate(region.id, {
                    scale: Math.min(4, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
                className="bg-card border-border w-full rounded border px-2 py-1 font-mono text-xs"
              />
            </label>
            <div className="flex items-end">
              <MechButton type="button" onClick={() => onRemove(region.id)} className="text-xs">
                <Trash className="h-3.5 w-3.5" />
                Remove
              </MechButton>
            </div>
          </li>
        ))}
      </ul>
    </AnalogCard>
  );
}
