import { create } from "zustand";

import type { BackgroundBlurPreset } from "@/lib/demo/demo-background-presets";
import type { DemoBackground, DemoPlaybackSpeed, ZoomRegion } from "@/lib/demo/demo-types";

import { DEMO_PLAYBACK_SPEEDS } from "@/lib/demo/demo-types";

type DemoEditorState = {
  sessionId: string | null;
  zoomRegions: ZoomRegion[];
  trimStartMs: number | null;
  trimEndMs: number | null;
  playbackSpeed: DemoPlaybackSpeed;
  backgroundBlur: BackgroundBlurPreset;
  pipEnabled: boolean;
  background: DemoBackground;
  previewTimeMs: number;
  isDirty: boolean;

  bindSession: (
    sessionId: string,
    initial: {
      zoomRegions: ZoomRegion[];
      trimStartMs: number | null;
      trimEndMs: number | null;
      playbackSpeed: number;
      backgroundBlur: number;
      pipEnabled: boolean;
      background: DemoBackground;
    },
  ) => void;
  setPreviewTimeMs: (ms: number) => void;
  addZoomRegion: (region: ZoomRegion) => void;
  mergeSuggestedZoomRegions: (regions: ZoomRegion[]) => void;
  updateZoomRegion: (id: string, patch: Partial<ZoomRegion>) => void;
  removeZoomRegion: (id: string) => void;
  setTrimStartMs: (ms: number | null) => void;
  setTrimEndMs: (ms: number | null) => void;
  setPlaybackSpeed: (speed: DemoPlaybackSpeed) => void;
  setBackgroundBlur: (level: BackgroundBlurPreset) => void;
  setPipEnabled: (enabled: boolean) => void;
  setBackground: (bg: DemoBackground) => void;
  markSaved: () => void;
};

const defaultBackground: DemoBackground = { type: "solid", value: "#0a0a0a" };

function normalizePlaybackSpeed(speed: number): DemoPlaybackSpeed {
  const match = DEMO_PLAYBACK_SPEEDS.find((s) => Math.abs(s - speed) < 0.01);
  return match ?? 1;
}

function normalizeBlur(level: number): BackgroundBlurPreset {
  if (level === 1 || level === 2 || level === 3) return level;
  return 0;
}

export const useDemoEditorStore = create<DemoEditorState>((set) => ({
  sessionId: null,
  zoomRegions: [],
  trimStartMs: null,
  trimEndMs: null,
  playbackSpeed: 1,
  backgroundBlur: 0,
  pipEnabled: true,
  background: defaultBackground,
  previewTimeMs: 0,
  isDirty: false,

  bindSession: (sessionId, initial) =>
    set({
      sessionId,
      zoomRegions: initial.zoomRegions,
      trimStartMs: initial.trimStartMs,
      trimEndMs: initial.trimEndMs,
      playbackSpeed: normalizePlaybackSpeed(initial.playbackSpeed),
      backgroundBlur: normalizeBlur(initial.backgroundBlur),
      pipEnabled: initial.pipEnabled,
      background: initial.background,
      previewTimeMs: 0,
      isDirty: false,
    }),

  setPreviewTimeMs: (ms) => set({ previewTimeMs: ms }),

  addZoomRegion: (region) =>
    set((state) => ({
      zoomRegions: [...state.zoomRegions, region],
      isDirty: true,
    })),

  mergeSuggestedZoomRegions: (regions) =>
    set((state) => ({
      zoomRegions: [...state.zoomRegions, ...regions],
      isDirty: true,
    })),

  updateZoomRegion: (id, patch) =>
    set((state) => ({
      zoomRegions: state.zoomRegions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      isDirty: true,
    })),

  removeZoomRegion: (id) =>
    set((state) => ({
      zoomRegions: state.zoomRegions.filter((r) => r.id !== id),
      isDirty: true,
    })),

  setTrimStartMs: (ms) => set({ trimStartMs: ms, isDirty: true }),
  setTrimEndMs: (ms) => set({ trimEndMs: ms, isDirty: true }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed, isDirty: true }),
  setBackgroundBlur: (level) => set({ backgroundBlur: level, isDirty: true }),
  setPipEnabled: (enabled) => set({ pipEnabled: enabled, isDirty: true }),
  setBackground: (bg) => set({ background: bg, isDirty: true }),
  markSaved: () => set({ isDirty: false }),
}));
