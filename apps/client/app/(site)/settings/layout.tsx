import type { Metadata } from "next";

import { requireHostSession } from "@/lib/auth/server-session";

import SettingsLayoutClient from "./settings-layout-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your operator profile, appearance, billing, and account.",
};

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
