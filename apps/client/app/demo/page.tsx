"use client";

import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { AnalogReveal } from "@/components/ui/analog-reveal";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { DEMO_EXPORT_LIMITS } from "@/lib/demo/demo-export-presets";

const BROWSER_LIMITS = [
  {
    title: "Chrome & Edge (recommended)",
    body: "Full getDisplayMedia with system audio tab/window capture. Best cursor logging fidelity.",
  },
  {
    title: "Safari",
    body: "Screen capture works; system audio from display capture is limited or unavailable — use mic track.",
  },
  {
    title: "Firefox",
    body: "Supported with picker quirks; test tab capture before recording a long demo.",
  },
  {
    title: "Linux",
    body: "PipeWire required for display capture. Native cursor hide is not available — we draw a styled overlay in preview/export v1.1.",
  },
] as const;

const DEMO_FLOW = [
  {
    step: "01",
    title: "Capture",
    body: "Share screen + optional mic. Cursor path logged at ~30 fps.",
  },
  {
    step: "02",
    title: "Edit",
    body: "Manual zoom regions, trim points, Retro Analog backgrounds.",
  },
  { step: "03", title: "Export", body: "16:9 or 9:16 via in-browser FFmpeg.wasm (short demos)." },
] as const;

export default function DemoLandingPage() {
  return (
    <ProductShell>
      <SiteHeader />
      <section className="border-border scroll-mt-24 border-b py-16 md:py-24">
        <AnalogReveal>
          <div className="mb-12 max-w-2xl">
            <MonoLabel>Creator suite · Lane 3</MonoLabel>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
              Browser product demos
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty">
              Screen Studio–lite in the browser: capture, cursor-aware preview, manual zoom, and
              vertical or landscape export — without a desktop app.
            </p>
          </div>
        </AnalogReveal>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {DEMO_FLOW.map((item, index) => (
            <AnalogReveal key={item.step} delay={(index + 1) as 1 | 2 | 3}>
              <AnalogCard className="h-full p-6">
                <MonoLabel>{item.step}</MonoLabel>
                <PanelTitle title={item.title} className="mt-2" />
                <p className="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
                  {item.body}
                </p>
              </AnalogCard>
            </AnalogReveal>
          ))}
        </div>

        <AnalogCard className="mb-10 flex flex-wrap items-center gap-4 p-6">
          <LedInline color="green" size="sm" pulse />
          <MonoLabel className="text-foreground flex-1">
            Sign in as host to record. Guests use studio rooms — demo mode is host-only.
          </MonoLabel>
          <Link href="/demo/record">
            <MechButton>Start product demo</MechButton>
          </Link>
          <Link href="/auth/signup">
            <MechButton className="bg-popover">Create account</MechButton>
          </Link>
        </AnalogCard>

        <PanelTitle label="Honest limits" title="Browser support" className="mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {BROWSER_LIMITS.map((item) => (
            <AnalogCard key={item.title} className="p-5">
              <PanelTitle title={item.title} />
              <p className="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
                {item.body}
              </p>
            </AnalogCard>
          ))}
        </div>

        <AnalogInset className="mt-8 p-5">
          <MonoLabel className="text-foreground block">Export length</MonoLabel>
          <p className="text-muted-foreground mt-2 font-mono text-xs leading-relaxed">
            {DEMO_EXPORT_LIMITS.note} Stay under {DEMO_EXPORT_LIMITS.maxRecommendedMinutes} minutes
            when possible; hard guidance cap is {DEMO_EXPORT_LIMITS.maxHardMinutes} minutes.
          </p>
        </AnalogInset>

        <AnalogCard className="mt-10 flex flex-wrap items-center gap-4 p-6">
          <MonoLabel className="text-muted-foreground">
            Deferred: auto-zoom from cursor clusters, GIF export, blur, annotations, desktop app.
          </MonoLabel>
          <Link
            href="/"
            className="text-accent hover:text-foreground ml-auto font-mono text-xs font-bold tracking-widest uppercase"
          >
            ← Home
          </Link>
        </AnalogCard>
      </section>
      <SiteFooter />
    </ProductShell>
  );
}
