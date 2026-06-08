"use client";

import { LedInline } from "@/components/ui/led";
import { StatusBadge } from "@/components/ui/retro-primitives";

import type { UploadDisplayStatus } from "./upload-status-utils";

const STATUS_CONFIG: Record<
  UploadDisplayStatus,
  {
    label: string;
    variant: "default" | "recording" | "ok" | "warn";
    led: "red" | "amber" | "green";
    pulse?: boolean;
  }
> = {
  recording: { label: "RECORDING", variant: "recording", led: "red", pulse: true },
  finalizing: { label: "FINALIZING", variant: "warn", led: "amber", pulse: true },
  uploading: { label: "UPLOADING", variant: "warn", led: "amber", pulse: true },
  recoverable: { label: "RECOVERABLE", variant: "warn", led: "amber" },
  failed: { label: "FAILED", variant: "recording", led: "red" },
  complete: { label: "COMPLETE", variant: "ok", led: "green" },
};

export function UploadStatusBadge({ status }: { status: UploadDisplayStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <StatusBadge variant={config.variant}>
      <LedInline color={config.led} size="sm" pulse={config.pulse} />
      {config.label}
    </StatusBadge>
  );
}
