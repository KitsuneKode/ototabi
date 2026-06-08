"use client";

import { Mic } from "@/lib/icons";

/**
 * Design 17 — Signal Lock
 * Phosphor instrument aesthetic. Converts via precision + calm authority.
 */
export default function Design17ClientPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#080808] font-sans text-[#E8E8E6]">
      <style>{`
        :root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --phosphor: #5FE878; }
        .phosphor { color: var(--phosphor); text-shadow: 0 0 12px rgba(95, 232, 120, 0.45); }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .meter-bar {
          background: linear-gradient(90deg, var(--phosphor) 0%, rgba(95,232,120,0.15) 100%);
          box-shadow: 0 0 20px rgba(95, 232, 120, 0.35);
        }
        .btn-primary {
          background: var(--phosphor);
          color: #0a0a0a;
          transition: transform 160ms var(--ease-out), filter 160ms ease;
        }
        .btn-primary:active { transform: scale(0.96); }
        .enter { animation: up 600ms var(--ease-out) forwards; opacity: 0; transform: translateY(12px) scale(0.98); }
        .enter-d1 { animation-delay: 80ms; }
        .enter-d2 { animation-delay: 160ms; }
        @keyframes up { to { opacity: 1; transform: none; } }
      `}</style>

      <div className="grid-bg pointer-events-none fixed inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-6 py-5 md:px-10">
        <span className="text-sm font-semibold tracking-tight">Ototabi</span>
        <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Design 17 / Signal Lock
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16 md:px-10 md:py-24">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="enter flex flex-col gap-8">
            <p className="phosphor font-mono text-[10px] tracking-[0.25em] uppercase">
              Local masters · Synced
            </p>
            <h1 className="max-w-[12ch] text-5xl leading-[0.95] font-semibold tracking-tight text-balance md:text-6xl">
              Record clean.
              <span className="block text-white/45">Export aligned.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-pretty text-white/55">
              Every guest captures on their device. You get separate tracks aligned for edit — not
              another compressed stream.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                Start recording free
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 px-7 py-3.5 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
              >
                See demo
              </button>
            </div>
          </div>

          <div className="enter enter-d1 rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-6">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] text-white/40 uppercase">
              <span>Session meter</span>
              <span className="phosphor">● REC</span>
            </div>
            <div className="mb-2 flex h-32 items-end gap-1">
              {[40, 65, 30, 80, 55, 90, 45, 70, 35, 85, 50, 75].map((h, i) => (
                <div
                  key={i}
                  className="meter-bar flex-1 rounded-sm"
                  style={{ height: `${h}%`, opacity: 0.35 + (i % 3) * 0.2 }}
                />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-[10px] text-white/45 uppercase">
              <div className="rounded border border-white/[0.06] p-3">
                <Mic className="phosphor mb-2 h-4 w-4" />
                Track A · Local
              </div>
              <div className="rounded border border-white/[0.06] p-3">Track B · Local</div>
            </div>
          </div>
        </section>

        <section className="enter enter-d2 grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-12 sm:grid-cols-3">
          {[
            { k: "<50ms", l: "Alignment target" },
            { k: "Resume", l: "After tab crash" },
            { k: "Multi", l: "Guest tracks" },
          ].map((s) => (
            <div key={s.l} className="border border-white/[0.06] p-5">
              <p className="phosphor text-2xl font-semibold tabular-nums">{s.k}</p>
              <p className="mt-1 text-xs text-white/45">{s.l}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
