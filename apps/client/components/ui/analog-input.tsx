"use client";

import { Input } from "@ototabi/ui/components/input";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Recessed LCD-style text field — aligns with Retro Analog input spec.
 */
export function AnalogInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        "bg-popover border-border text-foreground placeholder:text-muted-foreground/70 rounded-md border font-mono text-sm shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]",
        "focus-visible:border-accent focus-visible:ring-accent/30",
        className,
      )}
      {...props}
    />
  );
}
