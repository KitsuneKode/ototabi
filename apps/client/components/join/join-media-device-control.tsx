"use client";

import { Label } from "@ototabi/ui/components/label";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";

type JoinMediaDeviceControlProps = {
  id: string;
  label: string;
  enabled: boolean;
  onToggle: () => void;
  toggleLabels: { on: string; off: string };
  toggleAria: { on: string; off: string };
  devices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (value: string) => void;
  disabledLabel: string;
  error?: string;
  deviceKind?: "audioinput" | "videoinput";
};

export function JoinMediaDeviceControl({
  id,
  label,
  enabled,
  onToggle,
  toggleLabels,
  toggleAria,
  devices,
  selectedDevice,
  onDeviceChange,
  disabledLabel,
  error,
  deviceKind = "audioinput",
}: JoinMediaDeviceControlProps) {
  const fallbackPrefix = deviceKind === "videoinput" ? "Camera" : "Microphone";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
        >
          {label}
        </Label>
        <button
          type="button"
          aria-label={enabled ? toggleAria.on : toggleAria.off}
          aria-pressed={enabled}
          onClick={onToggle}
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-[background-color,border-color] ${
            enabled
              ? "bg-led-green/10 text-led-green border-led-green/30"
              : "bg-led-on/10 text-led-on border-led-on/30"
          }`}
        >
          {enabled ? toggleLabels.on : toggleLabels.off}
        </button>
      </div>
      {enabled ? (
        <select
          id={id}
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="border-border bg-popover text-foreground focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-xs shadow-inner focus:ring-1 focus:outline-none"
        >
          {devices.length === 0 ? (
            <option value="">Searching for devices...</option>
          ) : (
            devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `${fallbackPrefix} ${d.deviceId.slice(0, 8)}`}
              </option>
            ))
          )}
        </select>
      ) : (
        <AnalogInset className="flex h-10 items-center justify-center border-dashed">
          <MonoLabel className="text-[10px]">{disabledLabel}</MonoLabel>
        </AnalogInset>
      )}
      {error ? <MonoLabel className="text-led-on text-[9px]">{error}</MonoLabel> : null}
    </div>
  );
}
