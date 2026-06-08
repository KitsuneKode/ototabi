import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

import RecoveryLayoutClient from "./recovery-layout-client";

export const metadata: Metadata = {
  title: "Recovery Console",
  description: "Retry pending local uploads from IndexedDB and OPFS storage.",
};

export default async function RecoveryLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return <RecoveryLayoutClient>{children}</RecoveryLayoutClient>;
}
