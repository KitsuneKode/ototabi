"use client";

import { JoinShell } from "@/components/layout/join-shell";
import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { AlertTriangle, RefreshCw } from "@/lib/icons";

export function JoinLoadingState() {
  return (
    <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="text-accent h-8 w-8 animate-spin" />
        <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
          Engaging Calibration Sequence...
        </span>
      </div>
    </div>
  );
}

type JoinErrorStateProps = {
  onReturn: () => void;
};

export function JoinErrorState({ onReturn }: JoinErrorStateProps) {
  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
      <AnalogCard className="w-full max-w-md p-8 text-center">
        <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
        <p className="text-led-on mb-2 text-lg font-bold tracking-wider uppercase">
          Reel Not Located
        </p>
        <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
          The studio join code or invite link is unrecognized, revoked, or expired.
        </p>
        <MechButton onClick={onReturn} className="w-full justify-center">
          Back to Dashboard
        </MechButton>
      </AnalogCard>
    </div>
  );
}

export function JoinPageFallback() {
  return (
    <JoinShell title="Join session" subtitle="Loading invite and device console…">
      <AnalogCard className="p-8">
        <MonoLabel>Preparing join surface…</MonoLabel>
      </AnalogCard>
    </JoinShell>
  );
}
