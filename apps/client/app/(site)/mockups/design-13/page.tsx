import type { Metadata } from "next";

import Design13ClientPage from "./design-13-client";

export const metadata: Metadata = {
  title: "Design 13 — Soft Neumorphic",
  description: "Neumorphic controls with soft embossed depth.",
};

export default function Design13Page() {
  return <Design13ClientPage />;
}
