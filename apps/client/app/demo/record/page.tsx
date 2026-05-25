"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { DemoCaptureManager } from "@/lib/demo/demo-capture-manager";
import { useAuthGate } from "@/lib/hooks/use-session";
import { Monitor, Radio } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

export default function DemoRecordPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { sessionReady, isBooting } = useAuthGate();
  const captureRef = useRef<DemoCaptureManager | null>(null);

  const [includeMic, setIncludeMic] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "recording" | "stopping">("idle");
  const [error, setError] = useState<string | null>(null);

  const startMutation = useMutation(trpc.demo.startSession.mutationOptions());
  const stopMutation = useMutation(trpc.demo.stopSession.mutationOptions());

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      const { sessionId: id } = await startMutation.mutateAsync({});
      setSessionId(id);
      const manager = new DemoCaptureManager();
      captureRef.current = manager;
      setPhase("recording");
      await manager.startCapture(id, { includeMic });
    } catch (err) {
      setPhase("idle");
      setSessionId(null);
      captureRef.current = null;
      setError(err instanceof Error ? err.message : "Could not start screen capture");
    }
  }, [includeMic, startMutation]);

  const handleStop = useCallback(async () => {
    if (!sessionId || !captureRef.current) return;
    setPhase("stopping");
    setError(null);
    try {
      const { cursorEvents } = await captureRef.current.stopCapture();
      await captureRef.current.flushUploads();
      await stopMutation.mutateAsync({ sessionId, cursorEvents });
      router.push(`/demo/${sessionId}/edit`);
    } catch (err) {
      setPhase("recording");
      setError(err instanceof Error ? err.message : "Failed to stop demo capture");
    }
  }, [sessionId, stopMutation, router]);

  if (isBooting || !sessionReady) {
    return (
      <AppShell>
        <AnalogCard className="p-8">
          <MonoLabel>Loading session…</MonoLabel>
        </AnalogCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/demo"
          className="text-muted-foreground hover:text-foreground font-mono text-[10px] tracking-widest uppercase"
        >
          ← Demo limits
        </Link>
      </div>
      <PageHeader
        label="Browser demo"
        title="Product demo capture"
        description="Screen + system audio via getDisplayMedia. Cursor path is logged for the editor overlay."
      />

      <AnalogCard className="space-y-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          {phase === "recording" ? (
            <StatusBadge variant="recording">
              <LedInline color="red" size="sm" pulse />
              REC
            </StatusBadge>
          ) : (
            <StatusBadge variant="default">
              <LedInline color="amber" size="sm" />
              STANDBY
            </StatusBadge>
          )}
          {sessionId ? (
            <MonoLabel className="text-muted-foreground">Session {sessionId.slice(-8)}</MonoLabel>
          ) : null}
        </div>

        <AnalogInset className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
          <Monitor className="text-muted-foreground h-12 w-12" />
          <PanelTitle
            label="Capture bus"
            title={phase === "recording" ? "Sharing screen…" : "Ready to arm record"}
          />
          <MonoLabel className="text-muted-foreground max-w-md text-center text-[10px] leading-relaxed">
            Pick a window or full screen in the browser picker. Stop sharing from the browser UI or
            use Stop below.
          </MonoLabel>
        </AnalogInset>

        <label className="border-border flex cursor-pointer items-center gap-3 rounded border px-4 py-3">
          <input
            type="checkbox"
            checked={includeMic}
            disabled={phase !== "idle"}
            onChange={(e) => setIncludeMic(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          <MonoLabel>Also record microphone (separate track)</MonoLabel>
        </label>

        {error ? <MonoLabel className="text-destructive text-[10px]">{error}</MonoLabel> : null}

        <div className="flex flex-wrap gap-3">
          {phase === "idle" ? (
            <MechButton onClick={() => void handleStart()} disabled={startMutation.isPending}>
              <Monitor className="h-3.5 w-3.5" />
              Start capture
            </MechButton>
          ) : null}
          {phase === "recording" ? (
            <MechButton onClick={() => void handleStop()}>
              <Radio className="h-3.5 w-3.5" />
              Stop &amp; edit
            </MechButton>
          ) : null}
          {phase === "stopping" ? <MonoLabel>Finalizing upload…</MonoLabel> : null}
          <Link href="/demo">
            <MechButton type="button" className="bg-popover">
              Cancel
            </MechButton>
          </Link>
        </div>
      </AnalogCard>
    </AppShell>
  );
}
