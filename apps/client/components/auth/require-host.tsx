"use client";

import { AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { useAuthGate, useSessionQuery } from "@/lib/hooks/use-session";

type RequireHostProps = {
  children: React.ReactNode;
};

/**
 * Client loading gate for host-only routes. Server layouts call requireHostSession()
 * for redirect(); this component avoids flashing protected content while the tRPC
 * session hydrates after navigation.
 */
export function RequireHost({ children }: RequireHostProps) {
  const { isBooting, showGate, sessionReady } = useAuthGate();
  const authState = useSessionQuery();

  const role = authState.data?.user?.role;
  const isGuest = role === "guest";

  if (isBooting || !sessionReady || isGuest || showGate) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <AnalogStatePanel title="Verifying access" message="Checking host console permissions..." />
      </div>
    );
  }

  return children;
}
