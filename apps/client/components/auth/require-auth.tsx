"use client";

import { useRouter } from "next/navigation";

import { AnalogStatePanel } from "@/components/patterns/analog-state-panel";
import { useAuthGate } from "@/lib/hooks/use-session";
import { AlertTriangle } from "@/lib/icons";

type RequireAuthProps = {
  children: React.ReactNode;
};

/** Redirects unauthenticated users to sign-in. */
export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const { isBooting, showGate, sessionReady } = useAuthGate();

  if (isBooting) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <AnalogStatePanel title="Verifying session" message="Establishing secure console link..." />
      </div>
    );
  }

  if (showGate) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center px-4 font-sans">
        <AnalogStatePanel
          title="Authentication required"
          message="Sign in to access this studio surface."
          actionLabel="Sign in"
          onAction={() => router.push("/auth/signin")}
          icon={<AlertTriangle className="text-led-on h-12 w-12" />}
        />
      </div>
    );
  }

  if (!sessionReady) return null;

  return children;
}
