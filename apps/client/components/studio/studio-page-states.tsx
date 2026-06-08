"use client";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { AlertTriangle } from "@/lib/icons";

type StudioAuthGateProps = {
  onSignIn: () => void;
};

export function StudioAuthGate({ onSignIn }: StudioAuthGateProps) {
  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
      <AnalogCard className="w-full max-w-sm p-8 text-center">
        <AlertTriangle className="text-led-on mx-auto mb-4 h-12 w-12" />
        <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
          Authentication Required
        </p>
        <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">
          You must be signed in to access the studio.
        </p>
        <MechButton onClick={onSignIn} className="w-full justify-center">
          Sign In
        </MechButton>
      </AnalogCard>
    </div>
  );
}

type StudioConnectionErrorProps = {
  message: string;
  onReturn: () => void;
};

export function StudioConnectionError({ message, onReturn }: StudioConnectionErrorProps) {
  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
      <AnalogCard className="w-full max-w-sm p-8 text-center">
        <div className="bg-led-on/10 border-led-on/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
          <AlertTriangle className="text-led-on h-6 w-6" />
        </div>
        <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">
          Connection Fault
        </p>
        <p className="text-muted-foreground mb-6 font-mono text-xs leading-normal">{message}</p>
        <MechButton onClick={onReturn} className="w-full justify-center">
          Return to Dashboard
        </MechButton>
      </AnalogCard>
    </div>
  );
}

export function StudioLoadingState() {
  return (
    <div className="bg-background text-foreground flex min-h-[100dvh] items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
        <div className="space-y-1 text-center">
          <span className="block animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Synchronizing Studio Link...
          </span>
          <AnalogInset className="mx-auto h-1.5 w-48">
            <div className="bg-accent/60 h-full w-2/3 animate-pulse rounded" />
          </AnalogInset>
        </div>
      </div>
    </div>
  );
}

export function StudioPageFallback() {
  return (
    <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
      <MonoLabel>Loading studio deck…</MonoLabel>
    </div>
  );
}
