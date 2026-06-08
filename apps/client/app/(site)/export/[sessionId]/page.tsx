import type { Metadata } from "next";

import ExportSessionClientPage from "./export-session-client";

export const metadata: Metadata = {
  title: "Export Console | Ototabi",
  description: "Browser export console for multi-track recording sessions.",
};

export default function ExportSessionPage() {
  return <ExportSessionClientPage />;
}
