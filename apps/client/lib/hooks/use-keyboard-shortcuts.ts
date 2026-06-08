"use client";

import { useEffect, useRef } from "react";

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
  { keys: ["r"], action: "toggleRecording", label: "Start / Stop Recording (host)" },
  { keys: ["m"], action: "toggleMute", label: "Toggle Microphone Mute" },
  { keys: ["v"], action: "toggleVideo", label: "Toggle Video" },
  { keys: ["s"], action: "toggleScreenShare", label: "Toggle Screen Share" },
  { keys: ["Space"], action: "pttDown", label: "Push to Talk (hold)" },
  { keys: ["?"], action: "toggleShortcuts", label: "Show / Hide Shortcuts Overlay" },
  { keys: ["Esc"], action: "dismiss", label: "Close overlay or sidebar" },
];

export function useKeyboardShortcuts(handlers: {
  [K in ShortcutAction]?: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const pressed = e.key.toLowerCase();
      const h = handlersRef.current;

      if (pressed === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        h.toggleRecording?.();
      }
      if (pressed === "m" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        h.toggleMute?.();
      }
      if (pressed === "v" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        h.toggleVideo?.();
      }
      if (pressed === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        h.toggleScreenShare?.();
      }
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey) {
        if (e.repeat) return;
        e.preventDefault();
        h.pttDown?.();
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        h.toggleShortcuts?.();
      }
      if (e.key === "Escape") {
        h.dismiss?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlersRef.current.pttUp?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
