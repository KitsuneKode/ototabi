"use client";

import Link from "next/link";

import { MechButton } from "@/components/ui/retro-primitives";
import { useSessionQuery } from "@/lib/hooks/use-session";

type PricingTierCtaProps = {
  tierId: string;
  defaultHref: string;
  defaultLabel: string;
  highlighted?: boolean;
};

export function PricingTierCta({
  tierId,
  defaultHref,
  defaultLabel,
  highlighted,
}: PricingTierCtaProps) {
  const authState = useSessionQuery();
  const isSignedIn = !!authState.data?.user;

  const href = tierId === "creator" && isSignedIn ? "/dashboard" : defaultHref;
  const label = tierId === "creator" && isSignedIn ? "Open dashboard" : defaultLabel;

  return (
    <Link href={href} className="w-full">
      <MechButton type="button" className={`w-full ${highlighted ? "" : "opacity-90"}`}>
        {label}
      </MechButton>
    </Link>
  );
}
