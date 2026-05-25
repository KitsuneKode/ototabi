"use client";

import Link from "next/link";

import { MechButton } from "@/components/ui/retro-primitives";
import { useSessionQuery } from "@/lib/hooks/use-session";
import { ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

type MarketingPrimaryCtaProps = {
  signedOutHref?: string;
  signedInHref?: string;
  signedOutLabel?: string;
  signedInLabel?: string;
  className?: string;
  buttonClassName?: string;
  showArrow?: boolean;
};

export function MarketingPrimaryCta({
  signedOutHref = "/auth/signup",
  signedInHref = "/dashboard",
  signedOutLabel = "Start recording free",
  signedInLabel = "Open dashboard",
  className,
  buttonClassName,
  showArrow = true,
}: MarketingPrimaryCtaProps) {
  const authState = useSessionQuery();
  const isSignedIn = !!authState.data?.user;
  const href = isSignedIn ? signedInHref : signedOutHref;
  const label = isSignedIn ? signedInLabel : signedOutLabel;

  return (
    <Link href={href} className={className}>
      <MechButton type="button" className={cn("group", buttonClassName)}>
        <span>{label}</span>
        {showArrow ? (
          <ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
        ) : null}
      </MechButton>
    </Link>
  );
}
