import type { Metadata } from "next";

import Design10ClientPage from "./design-10-client";

export const metadata: Metadata = {
  title: "Design 10 — Minimal Editorial",
  description: "Clean editorial layout with restrained typography.",
};

export default function Design10Page() {
  return <Design10ClientPage />;
}
