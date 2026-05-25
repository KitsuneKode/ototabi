"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ototabi/ui/components/accordion";
import Link from "next/link";

import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketingPrimaryCta } from "@/components/marketing/marketing-primary-cta";
import { PricingTierCta } from "@/components/marketing/pricing-tier-cta";
import { PRICING_TIERS } from "@/components/marketing/pricing-tiers";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { AnalogMotionReveal } from "@/components/ui/analog-motion";
import { AnalogReveal } from "@/components/ui/analog-reveal";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { CloudUpload, Layers, Mic, Shield, Users, Video, Waveform } from "@/lib/icons";

const SIGNAL_METRICS = [
  { label: "Track alignment", value: "<50ms", detail: "export target" },
  { label: "Chunk recovery", value: "4s", detail: "OPFS + IndexedDB" },
  { label: "Participants", value: "∞", detail: "per room session" },
] as const;

const WORKFLOW_STEPS = [
  {
    channel: "CH-01",
    title: "Spin up a studio",
    body: "Create a room, copy the join link, and invite guests — no installs, no plugins.",
  },
  {
    channel: "CH-02",
    title: "Record locally",
    body: "Each participant captures lossless tracks in the browser while LiveKit keeps everyone in sync.",
  },
  {
    channel: "CH-03",
    title: "Upload & produce",
    body: "Chunks resume after crashes. Review sessions, export aligned tracks, and run AI post-production.",
  },
] as const;

const BENTO_FEATURES = [
  {
    id: "tracks",
    title: "Isolated multi-track capture",
    body: "Camera, mic, and screen share become separate masters — not a single compressed stream.",
    icon: Layers,
    span: "md:col-span-2 md:row-span-2",
  },
  {
    id: "recovery",
    title: "Crash-proof uploads",
    body: "Multipart S3 with resume. Tab closes mid-session? Pick up from the recovery console.",
    icon: CloudUpload,
    span: "md:col-span-1",
  },
  {
    id: "guests",
    title: "Guest-ready rooms",
    body: "Share a code, admit participants, and keep host controls server-authoritative.",
    icon: Users,
    span: "md:col-span-1",
  },
  {
    id: "ai",
    title: "AI-native post",
    body: "Transcripts, chapters, clips, and show notes — editable artifacts, not black-box exports.",
    icon: Waveform,
    span: "md:col-span-3",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How is this different from Zoom or Riverside?",
    a: "Streams optimize for live viewing. Ototabi records a high-quality local file per participant, then aligns tracks for post-production — so weak Wi-Fi does not degrade your master audio.",
  },
  {
    q: "What happens if someone closes their tab?",
    a: "Recorded chunks stay in OPFS and IndexedDB. Uploads can resume from the recovery console without re-entering the studio.",
  },
  {
    q: "Do guests need an account?",
    a: "Guests can join with a room link and display name. Hosts sign in to create studios, manage sessions, and access recordings after the session ends.",
  },
  {
    q: "Can I self-host?",
    a: "Yes. The stack runs on your infrastructure: PostgreSQL, MinIO-compatible storage, LiveKit, and Bun workers — built for teams that want ownership.",
  },
] as const;

const HERO_WAVEFORM_HEIGHTS = [30, 50, 40, 70, 55, 85, 60, 75, 45, 90, 50, 65, 40, 80, 55] as const;

const PROOF_ITEMS = [
  "Independent podcast hosts who need masters, not meeting recordings",
  "Remote interview teams tired of losing a guest track when Wi-Fi dips",
  "Self-host operators who want Riverside-class capture on their own stack",
] as const;

function HeroDeviceMockup() {
  return (
    <AnalogCard
      interactive
      className="w-full max-w-2xl rotate-1 p-6 transition-transform duration-300 ease-[var(--ease-mechanical)] hover:rotate-0 md:p-8"
    >
      <div className="mb-5 flex items-center justify-between">
        <MonoLabel>CH 1 : Monitor bus</MonoLabel>
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-[10px] font-bold tracking-widest">REC</span>
          <div className="led-amber h-2.5 w-2.5 rounded-full" />
        </div>
      </div>

      <div className="scanlines border-border bg-popover relative mb-6 flex aspect-video w-full items-end overflow-hidden rounded-md border-4 px-4 pb-4 shadow-[inset_0_0_24px_rgba(0,0,0,0.85)]">
        <div className="relative z-10 flex h-16 w-full items-end gap-0.5 opacity-90">
          {HERO_WAVEFORM_HEIGHTS.map((height, index) => (
            <div
              key={index}
              className="bg-accent/80 flex-1 rounded-t-sm motion-safe:animate-pulse"
              style={{
                height: `${height}%`,
                animationDelay: `${index * 80}ms`,
                animationDuration: "1.4s",
              }}
            />
          ))}
        </div>
        <MonoLabel className="text-muted-foreground absolute top-3 left-3 z-10 text-[9px]">
          Live waveform preview
        </MonoLabel>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AnalogInset className="flex flex-col gap-2 p-4">
          <MonoLabel>Input 1</MonoLabel>
          <div className="flex items-center gap-2">
            <Mic className="text-accent h-4 w-4" />
            <span className="text-sm font-bold uppercase">Studio Mic</span>
          </div>
        </AnalogInset>
        <AnalogInset className="flex flex-col gap-2 p-4">
          <MonoLabel>Input 2</MonoLabel>
          <div className="flex items-center gap-2">
            <Video className="text-foreground h-4 w-4" />
            <span className="text-sm font-bold uppercase">4K Cam Link</span>
          </div>
        </AnalogInset>
      </div>
    </AnalogCard>
  );
}

function SignalStrip() {
  return (
    <section
      className="border-border grid grid-cols-1 gap-4 border-y py-12 sm:grid-cols-3"
      aria-label="Product metrics"
    >
      {SIGNAL_METRICS.map((metric, index) => (
        <AnalogReveal key={metric.label} delay={(index + 1) as 1 | 2 | 3}>
          <AnalogInset className="flex flex-col gap-1 p-5">
            <MonoLabel>{metric.label}</MonoLabel>
            <span className="text-foreground text-3xl font-bold tracking-tight uppercase tabular-nums">
              {metric.value}
            </span>
            <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
              {metric.detail}
            </span>
          </AnalogInset>
        </AnalogReveal>
      ))}
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="border-border scroll-mt-24 border-t py-20 md:py-28">
      <AnalogMotionReveal>
        <div className="mb-12 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
            From invite link to publishable masters
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed text-pretty">
            Three deliberate steps — no filler dashboards. Built for creators who care about
            reliability before flashy AI demos.
          </p>
        </div>
      </AnalogMotionReveal>

      <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {WORKFLOW_STEPS.map((item, index) => (
          <AnalogMotionReveal key={item.channel} staggerIndex={index + 1}>
            <li>
              <AnalogCard interactive className="flex h-full flex-col gap-4 p-6">
                <MonoLabel className="text-accent">{item.channel}</MonoLabel>
                <h3 className="text-lg font-bold tracking-tight uppercase">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {item.body}
                </p>
              </AnalogCard>
            </li>
          </AnalogMotionReveal>
        ))}
      </ol>
    </section>
  );
}

function FeaturesBento() {
  return (
    <section id="features" className="border-border scroll-mt-24 border-t py-20 md:py-28">
      <AnalogMotionReveal>
        <div className="mb-12 max-w-xl">
          <h2 className="text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
            Studio hardware, browser-native
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg text-base leading-relaxed text-pretty">
            Capture-first workflows with mechanical reliability — not a single compressed stream.
          </p>
        </div>
      </AnalogMotionReveal>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-flow-dense md:grid-cols-3">
        {BENTO_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <AnalogMotionReveal key={feature.id} staggerIndex={index} className={feature.span}>
              <AnalogCard interactive className="flex h-full flex-col gap-4 p-6 md:p-8">
                <div className="bg-popover border-border flex h-11 w-11 items-center justify-center rounded-md border">
                  <Icon className="text-accent h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight uppercase">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {feature.body}
                </p>
              </AnalogCard>
            </AnalogMotionReveal>
          );
        })}
      </div>
    </section>
  );
}

const COMPARISON_ROWS = [
  {
    capability: "Per-participant local masters",
    stream: "Single mixed stream",
    riverside: "Local tracks",
    ototabi: "Local tracks + recovery",
  },
  {
    capability: "Crash upload resume",
    stream: "No",
    riverside: "Partial",
    ototabi: "OPFS + IndexedDB console",
  },
  {
    capability: "AI clips + 9:16 export",
    stream: "No",
    riverside: "Pro tier",
    ototabi: "Worker + WASM hybrid",
  },
  {
    capability: "Self-host stack",
    stream: "No",
    riverside: "No",
    ototabi: "MIT core + your infra",
  },
] as const;

function ComparisonStrip() {
  return (
    <section className="border-border scroll-mt-24 border-t py-16 md:py-20">
      <AnalogMotionReveal>
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight uppercase md:text-4xl">
            Stream tools vs local masters
          </h2>
        </div>
        <AnalogCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse font-mono text-[11px]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-muted-foreground p-4 text-left font-bold tracking-widest uppercase">
                  Capability
                </th>
                <th className="text-muted-foreground p-4 text-left font-bold tracking-widest uppercase">
                  Stream tools
                </th>
                <th className="text-muted-foreground p-4 text-left font-bold tracking-widest uppercase">
                  Riverside-class
                </th>
                <th className="text-accent p-4 text-left font-bold tracking-widest uppercase">
                  Ototabi
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.capability} className="border-border border-b last:border-0">
                  <td className="text-foreground p-4 font-bold">{row.capability}</td>
                  <td className="text-muted-foreground p-4">{row.stream}</td>
                  <td className="text-muted-foreground p-4">{row.riverside}</td>
                  <td className="text-foreground p-4">{row.ototabi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalogCard>
      </AnalogMotionReveal>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="border-border border-t py-20 md:py-28">
      <AnalogMotionReveal>
        <h2 className="sr-only">Built for</h2>
        <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          {PROOF_ITEMS.map((line) => (
            <li key={line}>
              <AnalogInset className="h-full p-5 text-center">
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{line}</p>
              </AnalogInset>
            </li>
          ))}
        </ul>
      </AnalogMotionReveal>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="border-border scroll-mt-24 border-t py-20 md:py-28">
      <AnalogReveal>
        <div className="mb-12 max-w-2xl">
          <MonoLabel>Pricing</MonoLabel>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-balance uppercase md:text-5xl">
            Start free. Scale on your stack.
          </h2>
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
    </section>
  );
}

function DifferentiatorBand() {
  return (
    <section className="border-border border-t py-20 md:py-28">
      <AnalogMotionReveal>
        <AnalogCard interactive className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balance uppercase md:text-4xl">
              Trust the capture. Automate the edit.
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed text-pretty">
              We prioritize recording reliability first: secure uploads, session recovery, and
              aligned multi-track export. AI editing comes after your masters are safe, not before.
            </p>
          </div>
          <ul className="flex flex-col justify-center gap-4">
            {[
              "Private media by default — scoped keys, no public bucket URLs",
              "Server-authoritative room and upload permissions",
              "Editable AI artifacts: chapters, clips, show notes",
            ].map((line, index) => (
              <li key={line}>
                <AnalogMotionReveal staggerIndex={index} className="flex items-start gap-3">
                  <Shield className="text-accent mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-sm leading-relaxed">{line}</span>
                </AnalogMotionReveal>
              </li>
            ))}
          </ul>
        </AnalogCard>
      </AnalogMotionReveal>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="border-border scroll-mt-24 border-t py-20 md:py-28">
      <AnalogReveal>
        <div className="mb-10 max-w-xl">
          <MonoLabel>FAQ</MonoLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight uppercase md:text-4xl">
            Common questions
          </h2>
        </div>
      </AnalogReveal>

      <AnalogCard className="overflow-hidden p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.q} value={item.q} className="border-border px-4">
              <AccordionTrigger className="font-mono text-xs font-bold tracking-widest uppercase hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnalogCard>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-border border-t py-20 md:py-28">
      <AnalogMotionReveal>
        <AnalogInset className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight uppercase md:text-4xl">
              Start your first studio session
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-sm text-pretty">
              Free to start. Your tracks stay on your infrastructure when you self-host.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <MarketingPrimaryCta
              signedInLabel="Open dashboard"
              className="w-full sm:w-auto"
              buttonClassName="w-full px-8 py-3.5 text-sm"
            />
            <Link
              href="/demo"
              className="border-border bg-card text-foreground hover:border-accent/50 hover:text-accent inline-flex min-h-11 w-full items-center justify-center rounded-md border px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-150 sm:w-auto"
            >
              View Demo
            </Link>
          </div>
        </AnalogInset>
      </AnalogMotionReveal>
    </section>
  );
}

export function LandingPage() {
  return (
    <ProductShell>
      <SiteHeader />

      <section className="flex flex-1 flex-col gap-14 lg:flex-row lg:items-center lg:gap-10">
        <AnalogMotionReveal className="max-w-2xl flex-1 space-y-8" delay={0.05}>
          <p className="text-accent font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
            Local masters. Synced.
          </p>

          <h1 className="max-w-[20ch] text-5xl leading-[0.92] font-bold tracking-tighter text-balance uppercase md:text-6xl lg:text-7xl">
            Record locally.
            <span className="text-foreground/55 block">Stay synced.</span>
          </h1>

          <p className="text-muted-foreground max-w-md text-base leading-relaxed text-pretty md:text-lg">
            High-definition video and lossless audio captured on every participant&apos;s device —
            then aligned for post-production when the session ends.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <MarketingPrimaryCta
              className="w-full sm:w-auto"
              buttonClassName="w-full px-8 py-4 text-base sm:w-auto"
            />
            <Link
              href="/#workflow"
              className="btn-panel-ghost text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center justify-center rounded-md px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase"
            >
              See Workflow
            </Link>
          </div>
        </AnalogMotionReveal>

        <AnalogMotionReveal className="relative w-full flex-1 lg:max-w-[52%]" delay={0.12}>
          <HeroDeviceMockup />
        </AnalogMotionReveal>
      </section>

      <SignalStrip />
      <ComparisonStrip />
      <ProofSection />
      <WorkflowSection />
      <FeaturesBento />
      <PricingSection />
      <DifferentiatorBand />
      <FaqSection />
      <FinalCta />
      <SiteFooter />
    </ProductShell>
  );
}
