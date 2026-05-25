"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DemoEditorPreview } from "@/components/demo/demo-editor-preview";
import { DemoZoomRegionList } from "@/components/demo/demo-zoom-region-list";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { DEMO_BACKGROUND_PRESETS } from "@/lib/demo/demo-background-presets";
import { DEMO_EXPORT_LIMITS } from "@/lib/demo/demo-export-presets";
import { DEMO_DISPLAY_TRACK_SID } from "@/lib/demo/demo-track-ids";
import { suggestZoomRegionsFromCursor } from "@/lib/demo/suggest-zoom-from-cursor";
import { useAuthGate } from "@/lib/hooks/use-session";
import { Download } from "@/lib/icons";
import { resolveTrackDownloadUrl } from "@/lib/resolve-track-download";
import { useDemoEditorStore } from "@/lib/stores/demo-editor-store";
import { useTRPC } from "@/trpc/client";
import { trpcClient } from "@/trpc/vanilla";

function newZoomRegion(previewTimeMs: number): {
  id: string;
  startMs: number;
  endMs: number;
  scale: number;
} {
  return {
    id: crypto.randomUUID(),
    startMs: previewTimeMs,
    endMs: previewTimeMs + 3000,
    scale: 1.5,
  };
}

export default function DemoEditPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const trpc = useTRPC();
  const { sessionReady, isBooting } = useAuthGate();

  const {
    zoomRegions,
    trimStartMs,
    trimEndMs,
    background,
    previewTimeMs,
    isDirty,
    bindSession,
    setPreviewTimeMs,
    addZoomRegion,
    mergeSuggestedZoomRegions,
    updateZoomRegion,
    removeZoomRegion,
    setTrimStartMs,
    setTrimEndMs,
    setBackground,
    markSaved,
  } = useDemoEditorStore();

  const demoQuery = useQuery({
    ...trpc.demo.getSession.queryOptions({ sessionId }),
    enabled: sessionReady && Boolean(sessionId),
  });

  const saveMutation = useMutation(
    trpc.demo.saveEdit.mutationOptions({
      onSuccess: () => markSaved(),
    }),
  );

  useEffect(() => {
    if (!demoQuery.data) return;
    bindSession(sessionId, {
      zoomRegions: demoQuery.data.demo.zoomRegions,
      trimStartMs: demoQuery.data.demo.trimStartMs,
      trimEndMs: demoQuery.data.demo.trimEndMs,
      background: demoQuery.data.demo.background,
    });
  }, [demoQuery.data, sessionId, bindSession]);

  const displayTrack = useMemo(() => {
    const tracks = demoQuery.data?.session.tracks ?? [];
    return (
      tracks.find((t) => t.trackSid === DEMO_DISPLAY_TRACK_SID && t.status === "COMPLETED") ??
      tracks.find((t) => t.type === "SCREENSHARE" && t.status === "COMPLETED") ??
      null
    );
  }, [demoQuery.data?.session.tracks]);

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!displayTrack) {
        setResolvedVideoUrl(null);
        return;
      }
      const ref = displayTrack.s3Url ?? displayTrack.s3Key;
      const url = await resolveTrackDownloadUrl(trpcClient, ref);
      if (!cancelled) setResolvedVideoUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [displayTrack]);

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      sessionId,
      zoomRegions,
      trimStartMs,
      trimEndMs,
      background,
    });
  }, [saveMutation, sessionId, zoomRegions, trimStartMs, trimEndMs, background]);

  if (isBooting || !sessionReady) {
    return (
      <AppShell>
        <AnalogCard className="p-8">
          <MonoLabel>Loading…</MonoLabel>
        </AnalogCard>
      </AppShell>
    );
  }

  if (demoQuery.isLoading) {
    return (
      <AppShell>
        <AnalogCard className="p-8">
          <MonoLabel>Loading demo session…</MonoLabel>
        </AnalogCard>
      </AppShell>
    );
  }

  if (demoQuery.isError || !demoQuery.data) {
    return (
      <AppShell>
        <AnalogCard className="p-8">
          <MonoLabel className="text-destructive">Demo session not found</MonoLabel>
          <Link href="/demo/record" className="text-accent mt-4 inline-block font-mono text-xs">
            Start new capture
          </Link>
        </AnalogCard>
      </AppShell>
    );
  }

  return (
    <AppShell maxWidth="max-w-5xl">
      <PageHeader
        label="Demo editor"
        title="Manual zoom &amp; frame"
        description="v1: CSS preview overlay + trim metadata. Full FFmpeg cursor draw ships in v1.1."
        actions={
          <div className="flex flex-wrap gap-2">
            <MechButton
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
            >
              Save edits
            </MechButton>
            <Link href={`/export/${sessionId}`}>
              <MechButton type="button">
                <Download className="h-3.5 w-3.5" />
                Export console
              </MechButton>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <DemoEditorPreview
          videoUrl={resolvedVideoUrl}
          cursorEvents={demoQuery.data.demo.cursorEvents}
          zoomRegions={zoomRegions}
          previewTimeMs={previewTimeMs}
          background={background}
          onTimeUpdate={setPreviewTimeMs}
        />

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Trim" title="In / out points (ms)" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <MonoLabel className="mb-1 block text-[9px]">Trim start (ms)</MonoLabel>
              <input
                type="number"
                min={0}
                value={trimStartMs ?? ""}
                onChange={(e) =>
                  setTrimStartMs(e.target.value === "" ? null : Number(e.target.value))
                }
                className="bg-card border-border w-full rounded border px-2 py-1.5 font-mono text-xs"
              />
            </label>
            <label>
              <MonoLabel className="mb-1 block text-[9px]">Trim end (ms)</MonoLabel>
              <input
                type="number"
                min={0}
                value={trimEndMs ?? ""}
                onChange={(e) =>
                  setTrimEndMs(e.target.value === "" ? null : Number(e.target.value))
                }
                className="bg-card border-border w-full rounded border px-2 py-1.5 font-mono text-xs"
              />
            </label>
          </div>
        </AnalogCard>

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Background" title="Retro Analog presets" />
          <div className="flex flex-wrap gap-2">
            {DEMO_BACKGROUND_PRESETS.map((preset) => {
              const active = preset.type === background.type && preset.value === background.value;
              return (
                <button
                  key={`${preset.type}-${preset.value}`}
                  type="button"
                  onClick={() => setBackground(preset)}
                  className={`border-border h-10 w-16 rounded border-2 transition-colors ${active ? "border-accent" : "border-transparent"}`}
                  style={
                    preset.type === "gradient"
                      ? { background: preset.value }
                      : { backgroundColor: preset.value }
                  }
                  aria-label={`Background ${preset.value}`}
                />
              );
            })}
          </div>
        </AnalogCard>

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Auto zoom" title="Cursor clusters (v1.1)" />
          <MonoLabel className="text-muted-foreground block text-[10px] leading-relaxed">
            Suggests zoom regions from pointer-down clusters. Review and edit before save.
          </MonoLabel>
          <MechButton
            type="button"
            onClick={() => {
              const suggested = suggestZoomRegionsFromCursor(demoQuery.data.demo.cursorEvents);
              if (suggested.length === 0) return;
              mergeSuggestedZoomRegions(suggested);
            }}
          >
            Suggest zoom from cursor
          </MechButton>
        </AnalogCard>

        <DemoZoomRegionList
          regions={zoomRegions}
          onUpdate={updateZoomRegion}
          onRemove={removeZoomRegion}
          onAdd={() => addZoomRegion(newZoomRegion(previewTimeMs))}
        />

        <AnalogCard className="p-6">
          <PanelTitle label="Export" title="Aspect presets" className="mb-3" />
          <MonoLabel className="text-muted-foreground block text-[10px] leading-relaxed">
            Use the export console for 16:9 and 9:16 FFmpeg.wasm renders. {DEMO_EXPORT_LIMITS.note}
            Recommended max length: {DEMO_EXPORT_LIMITS.maxRecommendedMinutes} minutes.
          </MonoLabel>
          <Link
            href={`/export/${sessionId}`}
            className="text-accent mt-3 inline-block font-mono text-xs font-bold tracking-widest uppercase"
          >
            Open export console →
          </Link>
        </AnalogCard>
      </div>
    </AppShell>
  );
}
