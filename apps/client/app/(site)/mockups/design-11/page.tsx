import type { Metadata } from "next";

import Design11ClientPage from "./design-11-client";

export const metadata: Metadata = {
  title: "Design 11 — Clay Bento",
  description: "Soft claymorphism bento grid studio console.",
};

export default function Design11Page() {
  return <Design11ClientPage />;
}
