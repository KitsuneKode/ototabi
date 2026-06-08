import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

import RecordingSessionLayoutClient from "./recording-session-layout-client";

export const metadata: Metadata = {
  title: "Session Review",
  description: "Review multi-track recordings, transcripts, chapters, and export options.",
};

export default async function RecordingSessionLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return <RecordingSessionLayoutClient>{children}</RecordingSessionLayoutClient>;
}
