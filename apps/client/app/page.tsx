import Link from 'next/link'
import {
  Mic,
  Video,
  Layers,
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-accent/20 selection:text-foreground p-4 md:p-8">
      {/* Mechanical noise texture */}
      <div className="noise-texture pointer-events-none fixed inset-0" />

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-end border-b-2 border-border pb-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold m-0 leading-none tracking-tight uppercase">
              Ototabi Studio
            </h1>
            <span className="font-mono text-sm tracking-widest text-muted-foreground block mt-2 uppercase">
              Model 16-A // High-Fidelity Local Recording
            </span>
          </div>

          <div className="hidden md:flex gap-6 items-end">
            {/* LED indicators */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-3 h-3 rounded-full led-red animate-pulse" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">PWR</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-3 h-3 rounded-full led-red-off" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">SYNC</span>
            </div>

            <div className="flex gap-3 ml-6">
              <Link
                href="/auth/signin"
                className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-150 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-mechanical inline-flex items-center justify-center rounded px-5 py-2 text-sm font-bold uppercase tracking-wider text-secondary-foreground"
              >
                Connect
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col md:flex-row gap-12 items-center">

          <div className="flex-1 space-y-8 max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 [animation-delay:150ms]">
            {/* Status badge — accent orange pip */}
            <div className="inline-flex items-center gap-3 bg-card border border-border px-3 py-1.5 rounded-sm chassis-shadow">
              <span className="w-2 h-2 rounded-full led-amber animate-pulse" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                Studio grade remote recording
              </span>
            </div>

            <h2 className="text-6xl md:text-8xl font-bold uppercase leading-[0.9] tracking-tighter">
              Record Locally.<br />
              <span className="text-muted-foreground">Stay Synced.</span>
            </h2>

            <p className="text-lg leading-relaxed text-muted-foreground font-medium max-w-md">
              Ototabi captures high-definition video and lossless audio directly on each participant's device, bypassing unstable connections for pristine post-production quality.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/auth/signup"
                className="btn-mechanical inline-flex items-center justify-center gap-3 rounded px-8 py-4 text-lg font-bold uppercase tracking-wider text-secondary-foreground group"
              >
                <span>Initialize Session</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" />
              </Link>
            </div>
          </div>

          {/* ── Device mockup ─────────────────────────────────────────────── */}
          <div className="flex-1 w-full relative animate-in fade-in slide-in-from-right-12 duration-700 [animation-delay:300ms]">
            <div className="bg-card rounded-lg border border-border chassis-shadow p-6 md:p-8 w-full max-w-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 ease-[var(--ease-mechanical)]">
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  CH 1 : Visual Input
                </span>
                <div className="flex items-center gap-2">
                  {/* REC badge — accent orange */}
                  <span className="font-mono text-[10px] tracking-widest text-accent font-bold">REC</span>
                  <div className="w-2.5 h-2.5 rounded-full led-amber animate-pulse" />
                </div>
              </div>

              {/* CRT display */}
              <div className="scanlines w-full aspect-video bg-[#111] border-4 border-[#1a1a1a] rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center overflow-hidden mb-6">
                <span className="font-mono text-muted-foreground text-sm tracking-widest uppercase relative z-10">
                  [ WAITING FOR FEED ]
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-popover p-4 rounded shadow-inner border border-border flex flex-col gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Input 1</span>
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-accent" />
                    <span className="font-bold uppercase text-sm">Studio Mic</span>
                  </div>
                </div>
                <div className="bg-popover p-4 rounded shadow-inner border border-border flex flex-col gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Input 2</span>
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-foreground" />
                    <span className="font-bold uppercase text-sm">4K Cam Link</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Feature Grid ────────────────────────────────────────────────── */}
        <section className="mt-24 mb-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t-2 border-border animate-in fade-in slide-in-from-bottom-8 duration-700 [animation-delay:500ms]">
          {[
            {
              icon: Video,
              title: 'Lossless Hardware Recording',
              desc: 'High-definition video and uncompressed audio recorded directly in your browser using IndexedDB. Zero streaming distortion.',
            },
            {
              icon: Layers,
              title: 'Resilient Multi-Track',
              desc: 'Individual separate tracks for each participant are uploaded automatically in chunks and aligned perfectly.',
            },
            {
              icon: Shield,
              title: 'Crash & Network Proof',
              desc: 'Our uploader automatically saves progress. Even if a guest disconnects or closes the tab, work resumes instantly.',
            },
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="flex flex-col gap-4 group"
                style={{ animationDelay: `${550 + i * 80}ms` }}
              >
                <div className="w-12 h-12 bg-card border border-border rounded chassis-shadow flex items-center justify-center transition-colors duration-200 group-hover:border-accent/50">
                  <Icon className="w-5 h-5 text-foreground group-hover:text-accent transition-colors duration-200" />
                </div>
                <h3 className="font-bold uppercase tracking-tight text-lg">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="mt-auto py-6 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
            &copy; {new Date().getFullYear()} OTOTABI STUDIO.
          </span>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full led-green" />
            <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
              System Online
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
