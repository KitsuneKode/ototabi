"use client";

import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { AnalogReveal } from "@/components/ui/analog-reveal";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";

const DEMO_STEPS = [
  {
    step: "01",
    title: "Create a room",
    body: "Sign in, open the dashboard, and spin up a studio with an invite link for guests.",
    href: "/dashboard",
    cta: "Open dashboard",
  },
  {
    step: "02",
    title: "Record locally",
    body: "Each participant captures high-quality tracks in the browser while LiveKit handles realtime AV.",
    href: "/auth/signup",
    cta: "Start free",
  },
  {
    step: "03",
    title: "Review & export",
    body: "Session review bundles tracks, timeline, and transcript in one pass — then master in the export console.",
    href: "/pricing",
    cta: "See pricing",
  },
] as const;

export default function DemoPage() {
  return (
    <ProductShell>
      <SiteHeader />
      <section className="border-border scroll-mt-24 border-b py-16 md:py-24">
        <AnalogReveal>
          <div className="mb-12 max-w-2xl">
            <MonoLabel>Product walkthrough</MonoLabel>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
              From invite to master tape
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty">
              A three-step flow through Ototabi — local-first recording, Retro Analog studio UX, and
              browser-based post-production.
            </p>
          </div>
        </AnalogReveal>

        <div className="space-y-6">
          {DEMO_STEPS.map((item, index) => (
            <AnalogReveal key={item.step} delay={(index + 1) as 1 | 2 | 3}>
              <AnalogCard className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-6">
                  <AnalogInset className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <span className="text-accent font-mono text-lg font-bold tabular-nums">
                      {item.step}
                    </span>
                  </AnalogInset>
                  <div>
                    <PanelTitle label={`Step ${item.step}`} title={item.title} />
                    <p className="text-muted-foreground mt-2 max-w-lg font-mono text-xs leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
                <Link href={item.href}>
                  <MechButton className="shrink-0">{item.cta}</MechButton>
                </Link>
              </AnalogCard>
            </AnalogReveal>
          ))}
        </div>

        <AnalogCard className="mt-10 flex flex-wrap items-center gap-4 p-6">
          <LedInline color="green" size="sm" pulse />
          <MonoLabel className="text-foreground">
            Beta: sign up, configure LiveKit + MinIO, run worker for transcripts
          </MonoLabel>
          <Link
            href="/"
            className="text-accent hover:text-foreground ml-auto font-mono text-xs font-bold tracking-widest uppercase"
          >
            ← Back to home
          </Link>
        </AnalogCard>
      </section>
      <SiteFooter />
    </ProductShell>
  );
}
