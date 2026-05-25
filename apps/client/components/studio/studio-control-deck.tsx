"use client";

import { ControlBar, type ControlBarProps } from "@livekit/components-react";

import { AnalogInset } from "@/components/ui/analog-card";
import { cn } from "@/lib/utils";

import "./livekit-analog-theme.css";

type StudioControlDeckProps = ControlBarProps & {
  className?: string;
};

/**
 * LiveKit control bar inside a recessed chassis strip (Retro Analog cockpit footer).
 */
export function StudioControlDeck({ className, ...props }: StudioControlDeckProps) {
  return (
    <AnalogInset
      className={cn(
        "flex w-full max-w-3xl items-center justify-center gap-2 rounded-lg px-4 py-2",
        className,
      )}
    >
      <ControlBar variation="minimal" {...props} />
    </AnalogInset>
  );
}
