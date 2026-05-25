"use client";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, StatusBadge } from "@/components/ui/retro-primitives";

type PipelineStep = { status: string; error: string | null };

type AiPipelineStatusProps = {
  pipeline: {
    transcript: PipelineStep;
    llm: PipelineStep;
    clips: PipelineStep;
  };
  aiStatus: "pending" | "processing" | "ready" | "failed" | "skipped";
};

function stepVariant(status: string): "default" | "ok" | "warn" {
  if (status === "ready") return "ok";
  if (status === "failed" || status === "processing") return "warn";
  return "default";
}

function stepLed(status: string): "green" | "amber" | "red" | "green-off" {
  if (status === "ready") return "green";
  if (status === "failed") return "red";
  if (status === "processing") return "amber";
  return "green-off";
}

const STEPS: Array<{ key: keyof AiPipelineStatusProps["pipeline"]; label: string }> = [
  { key: "transcript", label: "Transcript" },
  { key: "llm", label: "Chapters & notes" },
  { key: "clips", label: "Clip pack" },
];

export function AiPipelineStatus({ pipeline, aiStatus }: AiPipelineStatusProps) {
  const aggregateVariant =
    aiStatus === "ready"
      ? "ok"
      : aiStatus === "processing" || aiStatus === "failed"
        ? "warn"
        : "default";

  return (
    <AnalogInset className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MonoLabel>AI pipeline</MonoLabel>
        <StatusBadge variant={aggregateVariant}>
          <LedInline
            color={
              aiStatus === "ready"
                ? "green"
                : aiStatus === "failed"
                  ? "red"
                  : aiStatus === "processing"
                    ? "amber"
                    : "green-off"
            }
            size="sm"
            pulse={aiStatus === "processing"}
          />
          {aiStatus.toUpperCase()}
        </StatusBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {STEPS.map(({ key, label }) => {
          const step = pipeline[key];
          return (
            <div
              key={key}
              className="border-border bg-card flex flex-col gap-1 rounded border px-3 py-2"
            >
              <MonoLabel className="text-[9px]">{label}</MonoLabel>
              <StatusBadge variant={stepVariant(step.status)} className="w-fit text-[9px]">
                <LedInline
                  color={stepLed(step.status)}
                  size="sm"
                  pulse={step.status === "processing"}
                />
                {step.status}
              </StatusBadge>
              {step.error ? (
                <p className="text-led-on font-mono text-[9px] leading-snug">{step.error}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </AnalogInset>
  );
}
