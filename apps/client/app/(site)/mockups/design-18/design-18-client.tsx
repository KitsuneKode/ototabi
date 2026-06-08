"use client";

/**
 * Design 18 — Tape Archive
 * Warm editorial light. Converts via calm trust (NPR / documentary hosts).
 */
export default function Design18ClientPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F3EFE6] text-[#1C1B18]">
      <style>{`
        :root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --rust: #B84A32; }
        .serif-display { font-family: Georgia, 'Times New Roman', serif; }
        .tape-edge {
          box-shadow: inset 0 0 0 1px rgba(28,27,24,0.08), 0 24px 48px rgba(28,27,24,0.08);
        }
        .btn-rust {
          background: var(--rust);
          color: #FDFBF7;
          transition: transform 160ms var(--ease-out);
        }
        .btn-rust:active { transform: scale(0.96); }
      `}</style>

      <header className="flex items-center justify-between border-b border-[#1C1B18]/10 px-6 py-6 md:px-12">
        <span className="serif-display text-2xl">Ototabi</span>
        <span className="text-[10px] tracking-[0.2em] text-[#1C1B18]/45 uppercase">
          Design 18 / Tape Archive
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-16 md:px-12 md:py-24">
        <section className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-4 text-[11px] tracking-[0.2em] text-[#1C1B18]/50 uppercase">
              Remote recording for serious shows
            </p>
            <h1 className="serif-display text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl">
              Your guests record locally. You keep the master.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-pretty text-[#1C1B18]/65">
              When the call ends, you have aligned tracks ready for edit — not a single muddy file
              from the cloud.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" className="btn-rust rounded-sm px-8 py-3.5 text-sm font-medium">
                Start recording free
              </button>
              <button
                type="button"
                className="rounded-sm border border-[#1C1B18]/20 px-8 py-3.5 text-sm text-[#1C1B18]/70"
              >
                How it works
              </button>
            </div>
          </div>
          <div className="tape-edge relative w-full max-w-sm rotate-2 rounded-sm bg-[#E8E2D6] p-8 transition-transform duration-500 hover:rotate-0">
            <div className="mb-6 h-2 w-full rounded-full bg-[#1C1B18]/10" />
            <div className="serif-display mb-2 text-lg">Session reel</div>
            <p className="font-mono text-xs text-[#1C1B18]/50">
              02:14:08 · 3 local tracks · Synced
            </p>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1C1B18]/15 bg-[#F3EFE6] font-mono text-[10px]"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#1C1B18]/10 bg-[#1C1B18]/10 md:grid-cols-3">
          {["Invite guests with a link", "Record on each device", "Upload & align tracks"].map(
            (step, i) => (
              <div key={step} className="bg-[#F3EFE6] p-8">
                <span className="font-mono text-xs text-[var(--rust)]">0{i + 1}</span>
                <p className="serif-display mt-3 text-xl">{step}</p>
              </div>
            ),
          )}
        </section>

        <p className="text-center text-sm text-[#1C1B18]/45">
          Trusted by interviewers who care about audio more than effects.
        </p>
      </main>
    </div>
  );
}
