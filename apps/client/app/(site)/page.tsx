import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Browser-based high-quality audio and video recording. Each participant records locally in pristine quality while staying synced in real-time.",
};

export default function HomePage() {
  return <LandingPage />;
}
