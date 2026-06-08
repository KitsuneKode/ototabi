import type { Metadata } from "next";

import Design19ClientPage from "./design-19-client";

export const metadata: Metadata = {
  title: "Design 19 — Patchbay Pro",
  description: "Professional patchbay routing console.",
};

export default function Design19Page() {
  return <Design19ClientPage />;
}
