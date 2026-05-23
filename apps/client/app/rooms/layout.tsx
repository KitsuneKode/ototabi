import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room — OtoTabi Studio",
  description: "Collaborative recording room for multi-track sessions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
