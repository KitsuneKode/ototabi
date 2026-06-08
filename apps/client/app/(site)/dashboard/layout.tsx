import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

import DashboardLayoutClient from "./dashboard-layout-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Create studios, review sessions, and recover local uploads.",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
