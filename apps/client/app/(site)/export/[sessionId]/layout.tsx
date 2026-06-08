import type { Metadata } from "next";

import { ExportSessionAuthGate } from "./export-session-auth-gate";

export const metadata: Metadata = {
  title: "Export Console | Ototabi",
  description: "Browser export console for multi-track recording sessions.",
};

export default function ExportSessionLayout({ children }: { children: React.ReactNode }) {
  return <ExportSessionAuthGate>{children}</ExportSessionAuthGate>;
}
