"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, StatusBadge } from "@/components/ui/retro-primitives";
import { Download, FolderOpen } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

type ExportBundlePickerProps = {
  sessionId: string;
};

const PRESET_ALL_TRACKS = "all-tracks";
const PRESET_POST_PRODUCTION = "post-production";

function statusVariant(status: string): "ok" | "warn" | "recording" | "default" {
  if (status === "ready") return "ok";
  if (status === "processing") return "warn";
  if (status === "unavailable") return "recording";
  return "default";
}

export function ExportBundlePicker({ sessionId }: ExportBundlePickerProps) {
  const trpc = useTRPC();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");

  const assetsQuery = useQuery(
    trpc.exports.listExportableAssets.queryOptions({ sessionId }, { staleTime: 30_000 }),
  );

  const assetList = assetsQuery.data?.assets;

  const readyIds = useMemo(
    () => new Set((assetList ?? []).filter((a) => a.status === "ready").map((a) => a.id)),
    [assetList],
  );

  const assets = assetList ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPreset = (preset: string) => {
    if (preset === PRESET_ALL_TRACKS) {
      setSelected(
        new Set(assets.filter((a) => a.kind === "track" && a.status === "ready").map((a) => a.id)),
      );
      return;
    }
    if (preset === PRESET_POST_PRODUCTION) {
      setSelected(
        new Set(
          assets
            .filter(
              (a) =>
                a.status === "ready" &&
                (a.kind === "session_episode_mp3" ||
                  a.kind === "session_landscape" ||
                  a.kind === "transcript_json"),
            )
            .map((a) => a.id),
        ),
      );
    }
  };

  const createBundle = useMutation(
    trpc.exports.createExportBundle.mutationOptions({
      onSuccess: (result) => {
        setErrorMessage("");
        if (result.zipDownloadUrl) {
          window.open(result.zipDownloadUrl, "_blank", "noopener,noreferrer");
          return;
        }
        for (const asset of result.assets) {
          window.open(asset.downloadUrl, "_blank", "noopener,noreferrer");
        }
      },
      onError: (err) => {
        setErrorMessage(err.message);
      },
    }),
  );

  const selectedReady = [...selected].filter((id) => readyIds.has(id));
  const canDownload = selectedReady.length > 0 && !createBundle.isPending;

  const downloadSelected = (asZip: boolean) => {
    if (selectedReady.length === 0) return;
    createBundle.mutate({ sessionId, assetIds: selectedReady, asZip });
  };

  if (assetsQuery.isLoading) {
    return (
      <MonoLabel className="text-muted-foreground text-[10px]">Loading export assets…</MonoLabel>
    );
  }

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <MechButton
          type="button"
          className="text-xs"
          onClick={() => applyPreset(PRESET_ALL_TRACKS)}
        >
          All tracks
        </MechButton>
        <MechButton
          type="button"
          className="text-xs"
          onClick={() => applyPreset(PRESET_POST_PRODUCTION)}
        >
          Post-production pack
        </MechButton>
        <MechButton
          type="button"
          className="text-xs"
          onClick={() =>
            setSelected(new Set(assets.filter((a) => a.status === "ready").map((a) => a.id)))
          }
        >
          Select all ready
        </MechButton>
        <MechButton type="button" className="text-xs" onClick={() => setSelected(new Set())}>
          Clear
        </MechButton>
      </div>

      <div className="space-y-2">
        {assets.map((asset) => {
          const isReady = asset.status === "ready";
          const checked = selected.has(asset.id);
          return (
            <AnalogInset key={asset.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                className="accent-accent h-4 w-4 shrink-0"
                checked={checked}
                disabled={!isReady}
                onChange={() => toggle(asset.id)}
                aria-label={`Select ${asset.label}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate font-mono text-xs font-bold">
                  {asset.label}
                </p>
                {asset.error ? (
                  <p className="text-led-on font-mono text-[9px]">{asset.error}</p>
                ) : null}
              </div>
              <StatusBadge variant={statusVariant(asset.status)}>
                {asset.status === "ready" ? (
                  <LedInline color="green" size="sm" />
                ) : asset.status === "processing" ? (
                  <LedInline color="amber" size="sm" pulse />
                ) : null}
                {asset.status.toUpperCase()}
              </StatusBadge>
            </AnalogInset>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MechButton
          type="button"
          disabled={!canDownload}
          onClick={() => downloadSelected(true)}
          className="inline-flex items-center gap-1.5"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {createBundle.isPending ? "Building ZIP…" : "Download ZIP"}
        </MechButton>
        <MechButton
          type="button"
          disabled={!canDownload}
          onClick={() => downloadSelected(false)}
          className="inline-flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download selected
        </MechButton>
        <MonoLabel className="text-muted-foreground text-[9px]">
          {selectedReady.length} of {selected.size} selected ready
        </MonoLabel>
      </div>

      {errorMessage ? (
        <p className="text-led-on font-mono text-[10px] leading-snug">{errorMessage}</p>
      ) : null}
    </div>
  );
}
