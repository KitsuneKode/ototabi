"use client";

import { useEffect } from "react";

import { useExportConsoleStore } from "@/lib/stores/export-console-store";

/** Resets export UI state when navigating between sessions. */
export function useExportConsole(sessionId: string) {
  const bindSession = useExportConsoleStore((s) => s.bindSession);

  useEffect(() => {
    bindSession(sessionId);
  }, [sessionId, bindSession]);

  return useExportConsoleStore();
}
