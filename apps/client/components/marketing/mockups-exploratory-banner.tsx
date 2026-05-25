"use client";

import Link from "next/link";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";

export function MockupsExploratoryBanner() {
  return (
    <AnalogInset className="border-accent/30 bg-accent/5 mb-8 flex flex-col gap-2 border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <MonoLabel className="text-accent mb-1 block">Design lab — exploratory only</MonoLabel>
        <p className="text-muted-foreground font-mono text-[11px] leading-relaxed">
          These mockups explore alternate aesthetics. Production Ototabi uses Retro Analog v3 only
          (see DESIGN.md).
        </p>
      </div>
      <Link
        href="/"
        className="text-accent hover:text-foreground font-mono text-xs font-bold tracking-widest uppercase transition-colors"
      >
        ← Production site
      </Link>
    </AnalogInset>
  );
}
