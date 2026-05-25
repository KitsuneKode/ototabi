"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuthGate } from "@/lib/hooks/use-session";

/**
 * Sends signed-in users to the dashboard instead of showing sign-in / sign-up again.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isBooting } = useAuthGate();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <p className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
          Opening dashboard...
        </p>
      </div>
    );
  }

  if (isBooting) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  return children;
}
