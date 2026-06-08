"use client";

import { RequireHost } from "@/components/auth/require-host";

export default function RecordingsLayoutClient({ children }: { children: React.ReactNode }) {
  return <RequireHost>{children}</RequireHost>;
}
