import type { Metadata } from "next";

import MockupsClientPage from "./mockups-client";

export const metadata: Metadata = {
  title: "Design Lab — OtoTabi Studio",
  description: "Explore UI mockups and component prototypes.",
};

export default function MockupsPage() {
  return <MockupsClientPage />;
}
