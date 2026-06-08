import type { Metadata } from "next";

import Design16ClientPage from "./design-16-client";

export const metadata: Metadata = {
  title: "Design 16 — Retro Analog",
  description: "Vintage analog hardware recording deck.",
};

export default function Design16Page() {
  return <Design16ClientPage />;
}
