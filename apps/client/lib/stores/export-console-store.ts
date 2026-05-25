import { create } from "zustand";

export type ExportProcessingStatus = "idle" | "loading-ffmpeg" | "processing" | "done" | "error";

export type ExportProcessingMode =
  | "merge"
  | "trim"
  | "720p"
  | "1080p"
  | "9:16"
  | "16:9"
  | "cuts"
  | null;

type ExportConsoleState = {
  sessionId: string | null;
  ffmpegLoaded: boolean;
  processingStatus: ExportProcessingStatus;
  processingMode: ExportProcessingMode;
  progress: number;
  selectedTrackIds: string[];
  cutSegmentIds: string[];
  previewCutRange: { startTime: number; endTime: number } | null;
  trimStart: string;
  trimEnd: string;
  trimTrackId: string | null;
  errorMessage: string;
  noiseReduction: boolean;

  bindSession: (sessionId: string) => void;
  setFfmpegLoaded: (loaded: boolean) => void;
  beginProcessing: (mode: NonNullable<ExportProcessingMode>) => void;
  setProcessingStatus: (status: ExportProcessingStatus) => void;
  setProgress: (progress: number) => void;
  setErrorMessage: (message: string) => void;
  setNoiseReduction: (enabled: boolean) => void;
  setTrimStart: (value: string) => void;
  setTrimEnd: (value: string) => void;
  setTrimTrackId: (trackId: string | null) => void;
  toggleTrack: (trackId: string) => void;
  toggleCutSegment: (segmentId: string) => void;
  clearCutSegments: () => void;
  setPreviewCutRange: (range: { startTime: number; endTime: number } | null) => void;
};

const initialExportConsole = {
  sessionId: null as string | null,
  ffmpegLoaded: false,
  processingStatus: "idle" as ExportProcessingStatus,
  processingMode: null as ExportProcessingMode,
  progress: 0,
  selectedTrackIds: [] as string[],
  cutSegmentIds: [] as string[],
  previewCutRange: null as { startTime: number; endTime: number } | null,
  trimStart: "",
  trimEnd: "",
  trimTrackId: null as string | null,
  errorMessage: "",
  noiseReduction: false,
};

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export const useExportConsoleStore = create<ExportConsoleState>((set, get) => ({
  ...initialExportConsole,

  bindSession: (sessionId) => {
    if (get().sessionId === sessionId) return;
    set({ ...initialExportConsole, sessionId });
  },

  setFfmpegLoaded: (loaded) => set({ ffmpegLoaded: loaded }),

  beginProcessing: (mode) =>
    set({
      processingMode: mode,
      processingStatus: "processing",
      progress: 0,
      errorMessage: "",
    }),

  setProcessingStatus: (status) => set({ processingStatus: status }),

  setProgress: (progress) => set({ progress }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  setNoiseReduction: (enabled) => set({ noiseReduction: enabled }),

  setTrimStart: (value) => set({ trimStart: value }),

  setTrimEnd: (value) => set({ trimEnd: value }),

  setTrimTrackId: (trackId) => set({ trimTrackId: trackId }),

  toggleTrack: (trackId) =>
    set((state) => ({
      selectedTrackIds: toggleId(state.selectedTrackIds, trackId),
    })),

  toggleCutSegment: (segmentId) =>
    set((state) => ({
      cutSegmentIds: toggleId(state.cutSegmentIds, segmentId),
    })),

  clearCutSegments: () => set({ cutSegmentIds: [], previewCutRange: null }),

  setPreviewCutRange: (range) => set({ previewCutRange: range }),
}));
