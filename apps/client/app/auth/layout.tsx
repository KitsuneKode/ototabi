import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — OtoTabi Studio",
  description: "Sign in or create an account for OtoTabi Studio.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
