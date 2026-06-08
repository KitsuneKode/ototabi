import type { Metadata } from "next";

import Design15ClientPage from "./design-15-client";

export const metadata: Metadata = {
  title: "Design 15 — Space Sleek",
  description: "Sleek space-age console with orbital accents.",
};

export default function Design15Page() {
  return <Design15ClientPage />;
}
