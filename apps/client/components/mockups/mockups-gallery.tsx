"use client";

import type { DesignPreset } from "@/lib/mockups/design-presets";

import { Sparkles } from "@/lib/icons";

type MockupsGalleryProps = {
  designs: DesignPreset[];
  selectedDesignId: number;
  activeDesign: DesignPreset;
  onSelectDesign: (id: number) => void;
};

export function MockupsGallery({
  designs,
  selectedDesignId,
  activeDesign,
  onSelectDesign,
}: MockupsGalleryProps) {
  return (
    <aside className="flex w-80 shrink-0 scrollbar-thin flex-col overflow-y-auto border-r border-zinc-900 bg-zinc-950 select-none">
      <div className="border-b border-zinc-900/60 bg-zinc-950/40 p-4">
        <span className="mb-1 block text-[9px] font-black tracking-widest text-zinc-500 uppercase">
          Select Preset
        </span>
        <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
          <span>Aesthetic Options</span>
          <span className="font-bold text-emerald-400">{selectedDesignId} of 16</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 p-2">
        {designs.map((design) => (
          <button
            key={design.id}
            type="button"
            onClick={() => onSelectDesign(design.id)}
            className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all duration-150 ${
              selectedDesignId === design.id
                ? "border-zinc-700 bg-zinc-900 shadow-inner"
                : "border-transparent bg-transparent text-zinc-400 hover:border-zinc-900 hover:bg-zinc-900/50 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-mono text-xs font-bold ${selectedDesignId === design.id ? "text-emerald-400" : "text-zinc-500"}`}
              >
                {String(design.id).padStart(2, "0")}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
                  selectedDesignId === design.id
                    ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-500"
                }`}
              >
                {design.category}
              </span>
            </div>
            <h3
              className={`text-xs font-black tracking-wider uppercase ${selectedDesignId === design.id ? "text-white" : "text-zinc-300"}`}
            >
              {design.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-zinc-500">
              {design.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-zinc-900 bg-zinc-950/80 p-4">
        <div className="space-y-1 rounded-lg border border-zinc-800/40 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Active Theme Specs
          </div>
          <p className="font-mono text-[10px] text-zinc-300">
            <span className="text-zinc-500">Preset Style:</span> {activeDesign.theme}
          </p>
        </div>
      </div>
    </aside>
  );
}
