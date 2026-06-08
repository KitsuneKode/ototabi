import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

import RecordingsLayoutClient from "./recordings-layout-client";

export const metadata: Metadata = {
  title: "Recordings",
  description: "Recent sessions across your studios — open review, export, or clips.",
};

export default async function RecordingsLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return <RecordingsLayoutClient>{children}</RecordingsLayoutClient>;
}
