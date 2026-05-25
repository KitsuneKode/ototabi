"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { useAuthGate, useSessionQuery } from "@/lib/hooks/use-session";

type RequireHostProps = {
  children: React.ReactNode;
};

/**
 * Redirects guest sessions away from host-only routes (dashboard, settings, recovery).
 */
export function RequireHost({ children }: RequireHostProps) {
  const router = useRouter();
  const { isBooting, showGate, sessionReady } = useAuthGate();
  const authState = useSessionQuery();

  const role = authState.data?.user?.role;
  const isGuest = role === "guest";

  useEffect(() => {
    if (!authState.isFetched || authState.isFetching) return;
    if (showGate) {
      router.replace("/auth/signin");
      return;
    }
    if (isGuest) {
      router.replace("/");
    }
  }, [authState.isFetched, authState.isFetching, showGate, isGuest, router]);

  if (isBooting || !sessionReady || isGuest || showGate) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <AnalogStatePanel title="Verifying access" message="Checking host console permissions..." />
      </div>
    );
  }

  return children;
}
