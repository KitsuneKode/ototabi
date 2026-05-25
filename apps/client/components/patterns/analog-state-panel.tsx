"use client";

import type { ReactNode } from "react";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MechButton, MonoLabel } from "@/components/ui/retro-primitives";

type AnalogStatePanelProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  children?: ReactNode;
};

export function AnalogStatePanel({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  children,
}: AnalogStatePanelProps) {
  return (
    <AnalogCard className="w-full max-w-md p-8 text-center">
      {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}
      <p className="text-led-on mb-2 text-sm font-bold tracking-wider uppercase">{title}</p>
      <p className="text-muted-foreground mb-6 font-mono text-xs leading-relaxed">{message}</p>
      {children}
      {actionLabel && onAction ? (
        <MechButton onClick={onAction} className="w-full justify-center">
          {actionLabel}
        </MechButton>
      ) : null}
    </AnalogCard>
  );
}

export function AnalogLoadingPanel({ label }: { label: string }) {
  return (
    <AnalogInset className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
      <MonoLabel className="animate-pulse">{label}</MonoLabel>
    </AnalogInset>
  );
}
