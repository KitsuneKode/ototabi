import type { ReactNode } from "react";

import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalogCard } from "@/components/ui/analog-card";
import { AnalogReveal } from "@/components/ui/analog-reveal";
import { MonoLabel } from "@/components/ui/retro-primitives";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <ProductShell>
      <SiteHeader />
      <AnalogReveal className="mx-auto w-full max-w-2xl py-12 md:py-16">
        <MonoLabel>Legal</MonoLabel>
        <h1 className="mt-2 text-4xl font-bold tracking-tight uppercase">{title}</h1>
        <p className="text-muted-foreground mt-2 font-mono text-[10px] tracking-widest uppercase">
          Last updated {updated}
        </p>
        <AnalogCard className="text-muted-foreground mt-8 space-y-4 p-8 text-sm leading-relaxed">
          {children}
        </AnalogCard>
        <p className="text-muted-foreground mt-8 text-center font-mono text-xs">
          <Link href="/" className="text-accent hover:underline">
            Return to home
          </Link>
        </p>
      </AnalogReveal>
      <SiteFooter />
    </ProductShell>
  );
}
