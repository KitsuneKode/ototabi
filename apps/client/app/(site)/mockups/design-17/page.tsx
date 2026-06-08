import type { Metadata } from "next";

import Design17ClientPage from "./design-17-client";

export const metadata: Metadata = {
  title: "Design 17 — Signal Lock",
  description: "Signal routing patchbay with lock indicators.",
};

export default function Design17Page() {
  return <Design17ClientPage />;
}
