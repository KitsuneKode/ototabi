"use client";

import { useEffect, useCallback } from "react";

export type ShortcutAction =
  | "toggleRecording"
  | "toggleMute"
  | "toggleVideo"
  | "toggleScreenShare"
  | "pttDown"
  | "pttUp"
  | "toggleShortcuts"
  | "dismiss";

export interface ShortcutDef {
  keys: string[];
  action: ShortcutAction;
  label: string;
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: ["r"], action: "toggleRecording", label: "Start / Stop Recording" },
  { keys: ["m"], action: "toggleMute", label: "Toggle Microphone Mute" },
  { keys: ["v"], action: "toggleVideo", label: "Toggle Video" },
  { keys: ["s"], action: "toggleScreenShare", label: "Toggle Screen Share" },
  { keys: ["Space"], action: "pttDown", label: "Push to Talk (hold)" },
  { keys: ["?"], action: "toggleShortcuts", label: "Show Shortcuts" },
  { keys: ["Esc"], action: "dismiss", label: "Close / Dismiss" },
];

export function useKeyboardShortcuts(handlers: {
  [K in ShortcutAction]?: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const pressed = e.key.toLowerCase();

      if (pressed === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.toggleRecording?.();
      }
      if (pressed === "m" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.toggleMute?.();
      }
      if (pressed === "v" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.toggleVideo?.();
      }
      if (pressed === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.toggleScreenShare?.();
      }
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey) {
        if (e.repeat) return;
        e.preventDefault();
        handlers.pttDown?.();
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.toggleShortcuts?.();
      }
      if (e.key === "Escape") {
        handlers.dismiss?.();
      }
    },
    [handlers],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlers.pttUp?.();
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
