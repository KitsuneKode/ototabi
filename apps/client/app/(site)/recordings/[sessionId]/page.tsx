import type { Metadata } from "next";

import RecordingSessionClientPage from "./recording-session-client";

export const metadata: Metadata = {
  title: "Session Review",
  description: "Review multi-track recordings, transcripts, chapters, and export options.",
};

export default function RecordingSessionPage() {
  return <RecordingSessionClientPage />;
}
