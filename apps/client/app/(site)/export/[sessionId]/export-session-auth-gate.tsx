"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { RequireHost } from "@/components/auth/require-host";

export function ExportSessionAuthGate({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireHost>{children}</RequireHost>
    </RequireAuth>
  );
}
