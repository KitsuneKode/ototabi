import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — OtoTabi Studio",
  description: "Manage your recording rooms and sessions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
