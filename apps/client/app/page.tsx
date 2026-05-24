import Link from "next/link";

import { Mic, Video, Layers, ArrowRight, Shield } from "@/lib/icons";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground selection:bg-accent/20 selection:text-foreground flex min-h-screen flex-col p-4 font-sans md:p-8">
      {/* Mechanical noise texture */}
      <div className="noise-texture pointer-events-none fixed inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="border-border animate-in fade-in slide-in-from-top-4 mb-12 flex items-end justify-between border-b-2 pb-4 duration-700">
          <div>
            <h1 className="m-0 text-4xl leading-none font-bold tracking-tight uppercase md:text-5xl">
              Ototabi Studio
            </h1>
            <span className="text-muted-foreground mt-2 block font-mono text-sm tracking-widest uppercase">
              Model 16-A // High-Fidelity Local Recording
            </span>
          </div>

          <div className="hidden items-end gap-6 md:flex">
            {/* LED indicators */}
            <div className="flex flex-col items-center gap-2">
              <div className="led-red h-3 w-3 animate-pulse rounded-full" />
              <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                PWR
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="led-red-off h-3 w-3 rounded-full" />
              <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                SYNC
              </span>
            </div>

            <div className="ml-6 flex gap-3">
              <Link
                href="/auth/signin"
                className="text-muted-foreground hover:text-accent py-2 font-mono text-sm font-bold tracking-widest uppercase transition-colors duration-150"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-mechanical text-secondary-foreground inline-flex items-center justify-center rounded px-5 py-2 text-sm font-bold tracking-wider uppercase"
              >
                Connect
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col items-center gap-12 md:flex-row">
          <div className="animate-in fade-in slide-in-from-bottom-8 max-w-xl flex-1 space-y-8 duration-700 [animation-delay:150ms]">
            {/* Status badge — accent orange pip */}
            <div className="bg-card border-border chassis-shadow inline-flex items-center gap-3 rounded-sm border px-3 py-1.5">
              <span className="led-amber h-2 w-2 animate-pulse rounded-full" />
              <span className="font-mono text-[11px] font-bold tracking-widest uppercase">
                Studio grade remote recording
              </span>
            </div>

            <h2 className="text-6xl leading-[0.9] font-bold tracking-tighter uppercase md:text-8xl">
              Record Locally.
              <br />
              <span className="text-muted-foreground">Stay Synced.</span>
            </h2>

            <p className="text-muted-foreground max-w-md text-lg leading-relaxed font-medium">
              Ototabi captures high-definition video and lossless audio directly on each
              participant's device, bypassing unstable connections for pristine post-production
              quality.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="btn-mechanical text-secondary-foreground group inline-flex items-center justify-center gap-3 rounded px-8 py-4 text-lg font-bold tracking-wider uppercase"
              >
                <span>Initialize Session</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* ── Device mockup ─────────────────────────────────────────────── */}
          <div className="animate-in fade-in slide-in-from-right-12 relative w-full flex-1 duration-700 [animation-delay:300ms]">
            <div className="bg-card border-border chassis-shadow w-full max-w-2xl rotate-1 transform rounded-lg border p-6 transition-transform duration-500 ease-[var(--ease-mechanical)] hover:rotate-0 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
                  CH 1 : Visual Input
                </span>
                <div className="flex items-center gap-2">
                  {/* REC badge — accent orange */}
                  <span className="text-accent font-mono text-[10px] font-bold tracking-widest">
                    REC
                  </span>
                  <div className="led-amber h-2.5 w-2.5 animate-pulse rounded-full" />
                </div>
              </div>

              {/* CRT display */}
              <div className="scanlines relative mb-6 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded border-4 border-[#1a1a1a] bg-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <span className="text-muted-foreground relative z-10 font-mono text-sm tracking-widest uppercase">
                  [ WAITING FOR FEED ]
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-popover border-border flex flex-col gap-2 rounded border p-4 shadow-inner">
                  <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                    Input 1
                  </span>
                  <div className="flex items-center gap-3">
                    <Mic className="text-accent h-4 w-4" />
                    <span className="text-sm font-bold uppercase">Studio Mic</span>
                  </div>
                </div>
                <div className="bg-popover border-border flex flex-col gap-2 rounded border p-4 shadow-inner">
                  <span className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                    Input 2
                  </span>
                  <div className="flex items-center gap-3">
                    <Video className="text-foreground h-4 w-4" />
                    <span className="text-sm font-bold uppercase">4K Cam Link</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Feature Grid ────────────────────────────────────────────────── */}
        <section className="border-border animate-in fade-in slide-in-from-bottom-8 mt-24 mb-12 grid grid-cols-1 gap-8 border-t-2 pt-12 duration-700 [animation-delay:500ms] md:grid-cols-3">
          {[
            {
              icon: Video,
              title: "Lossless Hardware Recording",
              desc: "High-definition video and uncompressed audio recorded directly in your browser using IndexedDB. Zero streaming distortion.",
            },
            {
              icon: Layers,
              title: "Resilient Multi-Track",
              desc: "Individual separate tracks for each participant are uploaded automatically in chunks and aligned perfectly.",
            },
            {
              icon: Shield,
              title: "Crash & Network Proof",
              desc: "Our uploader automatically saves progress. Even if a guest disconnects or closes the tab, work resumes instantly.",
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group flex flex-col gap-4"
                style={{ animationDelay: `${550 + i * 80}ms` }}
              >
                <div className="bg-card border-border chassis-shadow group-hover:border-accent/50 flex h-12 w-12 items-center justify-center rounded border transition-colors duration-200">
                  <Icon className="text-foreground group-hover:text-accent h-5 w-5 transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-bold tracking-tight uppercase">{feature.title}</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-border mt-auto flex flex-col items-center justify-between gap-4 border-t-2 py-6 md:flex-row">
          <span className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} OTOTABI STUDIO.
          </span>
          <div className="flex items-center gap-3">
            <div className="led-green h-2 w-2 rounded-full" />
            <span className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
              System Online
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
