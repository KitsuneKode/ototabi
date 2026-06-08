import type { Metadata } from "next";

import Design9ClientPage from "./design-9-client";

export const metadata: Metadata = {
  title: "Design 9 — Glass Aurora",
  description: "Frosted glass panels with aurora gradient lighting.",
};

export default function Design9Page() {
  return <Design9ClientPage />;
}
