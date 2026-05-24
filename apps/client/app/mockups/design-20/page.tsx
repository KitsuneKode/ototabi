"use client";

/**
 * Design 20 — Timeline Master
 * Waveform / edit-first story. Converts when post-production is the hook.
 */
export default function TimelineMasterMockup() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0B0F14] font-sans text-[#E6EDF3]">
      <style>{`
        :root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --cyan: #3DD6C6; }
        .wave {
          background: linear-gradient(180deg, transparent, rgba(61, 214, 198, 0.15));
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath fill='%23fff' d='M0 60 Q30 20 60 60 T120 60 T180 60 T240 60 T300 60 T360 60 T420 60 T480 60 T540 60 T600 60 T660 60 T720 60 T780 60 T840 60 T900 60 T960 60 T1020 60 T1080 60 T1140 60 T1200 60 V120 H0 Z'/%3E%3C/svg%3E");
          mask-size: cover;
        }
        .track-lane {
          background: linear-gradient(90deg, rgba(61,214,198,0.35) 0%, rgba(61,214,198,0.05) 100%);
        }
        .btn-cyan {
          background: var(--cyan);
          color: #0a0f12;
          transition: transform 160ms var(--ease-out);
        }
        .btn-cyan:active { transform: scale(0.96); }
      `}</style>

      <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5 md:px-10">
        <span className="text-sm font-semibold tracking-tight">Ototabi</span>
        <span className="font-mono text-[10px] text-white/35 uppercase">
          Design 20 / Timeline Master
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:px-10 md:py-20">
        <section className="mb-16 text-center">
          <p className="mb-4 font-mono text-[10px] tracking-[0.3em] text-[var(--cyan)] uppercase">
            Record · Align · Edit
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
            Separate tracks from every guest. One timeline when you are ready.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-pretty text-white/50">
            Ototabi is not a better video call. It is a capture pipeline that survives weak Wi-Fi
            and hands you aligned masters for real editing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-cyan rounded-md px-8 py-3.5 text-sm font-semibold">
              Start recording free
            </button>
            <button
              type="button"
              className="rounded-md border border-white/15 px-8 py-3.5 text-sm text-white/60"
            >
              See the timeline
            </button>
          </div>
        </section>

        <section className="wave relative mb-6 h-28 w-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f1419]">
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white/25 uppercase">
            Composite waveform · Session preview
          </div>
        </section>

        <section className="space-y-2">
          {[
            { name: "Host · Camera", w: "92%" },
            { name: "Guest · Mic", w: "78%" },
            { name: "Guest · Camera", w: "65%" },
          ].map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-4 rounded-md border border-white/[0.06] bg-[#0f1419] p-4"
            >
              <span className="w-32 shrink-0 font-mono text-[10px] text-white/45">{t.name}</span>
              <div className="track-lane h-8 flex-1 rounded-sm" style={{ maxWidth: t.w }} />
            </div>
          ))}
        </section>

        <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { t: "Capture", d: "Local high-quality per participant" },
            { t: "Align", d: "Sync markers under 50ms target" },
            { t: "Ship", d: "Export + AI-assisted edit artifacts" },
          ].map((c) => (
            <div key={c.t} className="border border-white/[0.06] p-6">
              <h3 className="font-medium text-[var(--cyan)]">{c.t}</h3>
              <p className="mt-2 text-sm text-white/45">{c.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
