import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Export Console | Ototabi",
  description: "Browser export console for multi-track recording sessions.",
};

export default async function ExportSessionLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return children;
}
