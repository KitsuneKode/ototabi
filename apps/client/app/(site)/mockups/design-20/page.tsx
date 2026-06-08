import type { Metadata } from "next";

import Design20ClientPage from "./design-20-client";

export const metadata: Metadata = {
  title: "Design 20 — Timeline Master",
  description: "Timeline-first mastering workstation.",
};

export default function Design20Page() {
  return <Design20ClientPage />;
}
