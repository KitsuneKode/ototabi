"use client";

import type { UploadDisplayStatus } from "@/components/patterns/upload-status-utils";

import { LedInline } from "@/components/ui/led";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { cn } from "@/lib/utils";

type RailItem = {
  id: string;
  label: string;
  state: "off" | "amber" | "green" | "red";
  detail?: string;
  pulse?: boolean;
};

function buildRailItems(params: {
  isRecording?: boolean;
  isPaused?: boolean;
  uploadStatus?: UploadDisplayStatus;
  syncOk?: boolean;
}): RailItem[] {
  const recordingState = params.isRecording ? (params.isPaused ? "amber" : "red") : "off";
  const uploadState =
    params.uploadStatus === "complete"
      ? "green"
      : params.uploadStatus === "recording" ||
          params.uploadStatus === "uploading" ||
          params.uploadStatus === "finalizing"
        ? "amber"
        : params.uploadStatus === "failed" || params.uploadStatus === "recoverable"
          ? "red"
          : "off";

  return [
    {
      id: "rec",
      label: "REC",
      state: recordingState,
      detail: params.isRecording ? (params.isPaused ? "PAUSED" : "LIVE") : "STBY",
      pulse: params.isRecording && !params.isPaused,
    },
    {
      id: "upload",
      label: "UPL",
      state: uploadState,
      detail: params.uploadStatus?.toUpperCase() ?? "IDLE",
      pulse: uploadState === "amber",
    },
    {
      id: "sync",
      label: "SYN",
      state: params.syncOk ? "green" : "amber",
      detail: params.syncOk ? "LOCK" : "WAIT",
    },
  ];
}

export function SessionStatusRail({
  isRecording,
  isPaused,
  uploadStatus,
  syncOk = true,
  className,
}: {
  isRecording?: boolean;
  isPaused?: boolean;
  uploadStatus?: UploadDisplayStatus;
  syncOk?: boolean;
  className?: string;
}) {
  const items = buildRailItems({ isRecording, isPaused, uploadStatus, syncOk });

  return (
    <div
      className={cn(
        "border-border bg-card chassis-shadow flex flex-wrap items-center gap-4 rounded-md border px-4 py-3",
        className,
      )}
      aria-label="Session status"
    >
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <LedInline
            color={item.state === "off" ? "amber" : item.state}
            size="sm"
            pulse={item.pulse}
            className={item.state === "off" ? "opacity-30" : undefined}
          />
          <div>
            <MonoLabel className="text-[9px]">{item.label}</MonoLabel>
            <output className="font-mono text-[10px] font-bold tracking-widest uppercase tabular-nums">
              {item.detail}
            </output>
          </div>
        </div>
      ))}
    </div>
  );
}
