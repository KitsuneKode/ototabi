import type { Metadata } from "next";

import Design18ClientPage from "./design-18-client";

export const metadata: Metadata = {
  title: "Design 18 — Tape Archive",
  description: "Tape reel archive and session log aesthetic.",
};

export default function Design18Page() {
  return <Design18ClientPage />;
}
