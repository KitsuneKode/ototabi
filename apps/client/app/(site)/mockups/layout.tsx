import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Lab — OtoTabi Studio",
  description: "Explore UI mockups and component prototypes.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
