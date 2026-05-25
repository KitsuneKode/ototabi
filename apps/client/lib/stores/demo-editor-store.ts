import { create } from "zustand";

import type { DemoBackground, ZoomRegion } from "@/lib/demo/demo-types";

type DemoEditorState = {
  sessionId: string | null;
  zoomRegions: ZoomRegion[];
  trimStartMs: number | null;
  trimEndMs: number | null;
  background: DemoBackground;
  previewTimeMs: number;
  isDirty: boolean;

  bindSession: (
    sessionId: string,
    initial: {
      zoomRegions: ZoomRegion[];
      trimStartMs: number | null;
      trimEndMs: number | null;
      background: DemoBackground;
    },
  ) => void;
  setPreviewTimeMs: (ms: number) => void;
  addZoomRegion: (region: ZoomRegion) => void;
  updateZoomRegion: (id: string, patch: Partial<ZoomRegion>) => void;
  removeZoomRegion: (id: string) => void;
  setTrimStartMs: (ms: number | null) => void;
  setTrimEndMs: (ms: number | null) => void;
  setBackground: (bg: DemoBackground) => void;
  markSaved: () => void;
};

const defaultBackground: DemoBackground = { type: "solid", value: "#0a0a0a" };

export const useDemoEditorStore = create<DemoEditorState>((set) => ({
  sessionId: null,
  zoomRegions: [],
  trimStartMs: null,
  trimEndMs: null,
  background: defaultBackground,
  previewTimeMs: 0,
  isDirty: false,

  bindSession: (sessionId, initial) =>
    set({
      sessionId,
      zoomRegions: initial.zoomRegions,
      trimStartMs: initial.trimStartMs,
      trimEndMs: initial.trimEndMs,
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
  setBackground: (bg) => set({ background: bg, isDirty: true }),
  markSaved: () => set({ isDirty: false }),
}));
