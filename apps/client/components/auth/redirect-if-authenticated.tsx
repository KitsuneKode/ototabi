"use client";

import type { ReactNode } from "react";

import { useAuthGate } from "@/lib/hooks/use-session";

/**
 * Client loading gate for auth pages. Server auth layout redirects signed-in users;
 * this avoids flashing sign-in UI while session state hydrates.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isBooting } = useAuthGate();

  if (isBooting) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  return children;
}
