import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session Review — OtoTabi Studio",
  description: "Review and manage your recorded sessions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
