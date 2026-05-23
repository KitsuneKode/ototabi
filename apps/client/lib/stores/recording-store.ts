import { create } from "zustand";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  sessionId: string | null;

  setRecording: (sessionId: string) => void;
  setPaused: (paused: boolean) => void;
  setStopped: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isPaused: false,
  sessionId: null,

  setRecording: (sessionId) => set({ isRecording: true, isPaused: false, sessionId }),
  setPaused: (paused) => set({ isPaused: paused }),
  setStopped: () => set({ isRecording: false, isPaused: false, sessionId: null }),
}));
