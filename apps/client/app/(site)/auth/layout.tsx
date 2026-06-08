import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Sign In — OtoTabi Studio",
  description: "Sign in or create an account for OtoTabi Studio.",
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/dashboard");
  }

  return children;
}
