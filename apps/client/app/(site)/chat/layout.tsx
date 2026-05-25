import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — OtoTabi Studio",
  description: "Browser-based high-quality audio and video recording studio.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
