"use client";

import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PricingTierCta } from "@/components/marketing/pricing-tier-cta";
import { PRICING_TIERS } from "@/components/marketing/pricing-tiers";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { AnalogReveal } from "@/components/ui/analog-reveal";
import { MonoLabel } from "@/components/ui/retro-primitives";

export default function PricingPage() {
  return (
    <ProductShell>
      <SiteHeader />
      <section className="border-border scroll-mt-24 border-b py-16 md:py-24">
        <AnalogReveal>
          <div className="mb-12 max-w-2xl">
            <MonoLabel>Pricing</MonoLabel>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
              Start free. Scale on your stack.
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty">
              No credit card during beta. Self-host when you need ownership, privacy, and custom
              workflows.
            </p>
          </div>
        </AnalogReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PRICING_TIERS.map((tier, index) => (
            <AnalogReveal key={tier.id} delay={(index + 1) as 1 | 2}>
              <AnalogCard
                className={`flex h-full flex-col gap-6 p-8 ${tier.highlighted ? "ring-accent/40 ring-1" : ""}`}
              >
                <div>
                  <MonoLabel>{tier.name}</MonoLabel>
                  <p className="mt-3 text-3xl font-bold tracking-tight uppercase tabular-nums">
                    {tier.price}
                  </p>
                  <p className="text-muted-foreground mt-1 font-mono text-[10px] tracking-widest uppercase">
                    {tier.period}
                  </p>
                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed text-pretty">
                    {tier.description}
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-foreground/90 flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span className="text-accent mt-1 font-mono text-xs">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <PricingTierCta
                  tierId={tier.id}
                  defaultHref={tier.href}
                  defaultLabel={tier.cta}
                  highlighted={tier.highlighted}
                />
              </AnalogCard>
            </AnalogReveal>
          ))}
        </div>

        <AnalogReveal delay={2}>
          <AnalogInset className="mt-12 p-6 text-center">
            <p className="text-muted-foreground font-mono text-xs leading-relaxed">
              Questions about enterprise or broadcast workflows?{" "}
              <Link href="/#faq" className="text-accent hover:underline">
                Read the FAQ
              </Link>{" "}
              or start a session from the{" "}
              <Link href="/" className="text-accent hover:underline">
                home page
              </Link>
              .
            </p>
          </AnalogInset>
        </AnalogReveal>
      </section>
      <SiteFooter />
    </ProductShell>
  );
}
