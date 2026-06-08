import type { Metadata } from "next";

import RecordingsListClientPage from "./recordings-list-client";

export const metadata: Metadata = {
  title: "Recordings",
  description: "Recent sessions across your studios — open review, export, or clips.",
};

export default function RecordingsPage() {
  return <RecordingsListClientPage />;
}
