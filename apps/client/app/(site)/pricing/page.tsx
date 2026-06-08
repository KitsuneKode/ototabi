import type { Metadata } from "next";

import PricingClientPage from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free during beta. Scale on your stack with self-hosted and cloud plans.",
};

export default function PricingPage() {
  return <PricingClientPage />;
}
