"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AnalogCard } from "@/components/ui/analog-card";
import { useAuthGate } from "@/lib/hooks/use-session";
import { useTRPC } from "@/trpc/client";

type RequireHostProps = {
  children: React.ReactNode;
};

/**
 * Redirects guest sessions away from host-only routes (dashboard, settings, recovery).
 */
export function RequireHost({ children }: RequireHostProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const { isBooting, showGate, sessionReady } = useAuthGate();
  const authState = useQuery(trpc.auth.getSession.queryOptions());

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
      <div className="bg-background flex min-h-screen items-center justify-center font-sans">
        <AnalogCard className="p-8 text-center">
          <p className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Verifying access...
          </p>
        </AnalogCard>
      </div>
    );
  }

  return children;
}
