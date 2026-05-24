"use client";

import { MechButton, MonoLabel } from "@/components/ui/retro-primitives";
import { ArrowRight, Mic, Video } from "@/lib/icons";

/**
 * Design 19 — Patchbay Pro
 * Premium evolution of Studio Console. Best default for Ototabi.
 */
export default function PatchbayProMockup() {
  return (
    <div className="bg-background text-foreground relative flex min-h-[100dvh] flex-col">
      <style>{`
        .vignette {
          background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(210, 120, 58, 0.12), transparent);
        }
        .rack-screw {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          background: linear-gradient(180deg, #2a2a28 0%, #1a1a18 100%);
        }
      `}</style>
      <div className="vignette pointer-events-none fixed inset-0" aria-hidden />
      <div className="noise-texture pointer-events-none fixed inset-0 opacity-[0.02]" aria-hidden />

      <header className="border-border relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between border-b px-6 py-6 md:px-10">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight uppercase">
            Ototabi Studio
          </h1>
          <p className="text-subtle-foreground mt-1 font-mono text-[10px] tracking-widest uppercase">
            Design 19 / Patchbay Pro
          </p>
        </div>
        <MechButton type="button" className="text-xs">
          Start free
          <ArrowRight className="h-4 w-4" />
        </MechButton>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-14 md:px-10 md:py-20">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="border-border bg-card inline-flex items-center gap-2 rounded-sm border px-3 py-1.5">
              <span className="led-amber h-1.5 w-1.5 rounded-full" />
              <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                Studio-grade capture
              </span>
            </div>
            <h2 className="font-display max-w-[13ch] text-5xl leading-[0.92] font-bold tracking-tighter uppercase md:text-6xl">
              Local tracks.
              <span className="text-foreground/50 block">Synced room.</span>
            </h2>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed text-pretty">
              Built like rack gear, runs in the browser. Guests record on their machine; you export
              aligned masters when the session ends.
            </p>
            <div className="flex flex-wrap gap-3">
              <MechButton type="button" className="px-8 py-3.5 text-sm">
                Start recording free
              </MechButton>
              <button
                type="button"
                className="btn-panel-ghost text-muted-foreground rounded-md px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase"
              >
                Watch demo
              </button>
            </div>
          </div>

          <div className="bg-card border-border chassis-shadow rack-screw rounded-xl border p-6 md:p-8">
            <div className="mb-4 flex justify-between">
              <MonoLabel>Monitor bus</MonoLabel>
              <span className="text-accent font-mono text-[10px] font-bold">REC</span>
            </div>
            <div className="scanlines border-border relative mb-5 flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 bg-[#0d0d0c]">
              <div className="absolute inset-x-0 bottom-0 flex h-16 items-end gap-0.5 px-4 pb-4 opacity-80">
                {[30, 50, 40, 70, 55, 85, 60, 75, 45, 90, 50, 65].map((h, i) => (
                  <div
                    key={i}
                    className="bg-accent/80 flex-1 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <span className="relative z-10 font-mono text-xs tracking-widest text-white/40 uppercase">
                3 tracks armed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-popover border-border rounded-md border p-3">
                <Mic className="text-accent mb-1 h-4 w-4" />
                <span className="text-xs font-bold uppercase">Mic · Local</span>
              </div>
              <div className="bg-popover border-border rounded-md border p-3">
                <Video className="mb-1 h-4 w-4" />
                <span className="text-xs font-bold uppercase">Cam · Local</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-border grid grid-cols-2 gap-4 border-t pt-12 md:grid-cols-4">
          {["Riverside.fm", "Descript", "Zencastr", "Spotify for Podcasters"].map((name) => (
            <div
              key={name}
              className="text-subtle-foreground flex h-12 items-center justify-center rounded-md border border-dashed border-white/10 font-mono text-[9px] tracking-wider uppercase"
            >
              {name}
            </div>
          ))}
        </section>
        <p className="text-subtle-foreground text-center text-xs">
          Placeholder proof row — swap for real logos or creator quote.
        </p>
      </main>
    </div>
  );
}
