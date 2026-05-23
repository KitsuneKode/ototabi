"use client";

import { Settings, Shield } from "lucide-react";

export default function MidnightGlowMockup() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#030712] p-6 font-sans text-gray-100">
      <style>{`
        :root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --primary-glow: #00f0ff; }
        .glow-border { position: relative; background: #030712; border-radius: 16px; }
        .glow-border::before {
          content: ""; position: absolute; inset: -1px; border-radius: 17px;
          background: linear-gradient(45deg, rgba(0, 240, 255, 0.5), rgba(0, 240, 255, 0), rgba(255, 0, 255, 0.5));
          z-index: -1; opacity: 0.5; transition: opacity 300ms ease;
        }
        .glow-border:hover::before { opacity: 1; }
        .btn-glow {
          background: transparent; color: var(--primary-glow); border: 1px solid var(--primary-glow);
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.1);
          transition: all 200ms var(--ease-out);
        }
        .btn-glow:hover {
          background: rgba(0, 240, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.2);
        }
        .btn-glow:active { transform: scale(0.96); box-shadow: 0 0 5px rgba(0, 240, 255, 0.2), inset 0 0 5px rgba(0, 240, 255, 0.1); }
        .fade-up { opacity: 0; transform: translateY(15px); animation: fadeUp 500ms var(--ease-out) forwards; }
        .delay-1 { animation-delay: 100ms; }
        .delay-2 { animation-delay: 200ms; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#030712] to-[#030712]" />
      <header className="fade-up relative z-10 mb-12 flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <div className="h-4 w-4 rounded-sm bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" /> OTOTABI
        </div>
        <div className="text-sm tracking-widest text-[#00f0ff] uppercase opacity-70">
          Design // 12
        </div>
      </header>
      <main className="fade-up relative z-10 flex w-full max-w-4xl flex-1 flex-col delay-1">
        <h1 className="mb-2 text-5xl font-semibold">Lobby Setup</h1>
        <p className="mb-10 text-lg text-gray-400">
          System diagnostics ready. Awaiting user input.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="glow-border group relative flex aspect-video flex-col items-center justify-center overflow-hidden md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="mb-2 animate-pulse font-mono text-sm tracking-wider text-[#00f0ff] uppercase opacity-50">
              [ NO VIDEO SIGNAL ]
            </div>
            <div className="h-1 w-16 overflow-hidden rounded-full border border-[#00f0ff]/30">
              <div className="h-full w-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] bg-[#00f0ff]/50" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="glow-border flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                <Settings className="h-3 w-3" /> Audio Source
              </div>
              <div className="text-sm">External Mic 01</div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-800">
                <div className="h-full w-2/3 bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
              </div>
            </div>
            <div className="glow-border flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                <Shield className="h-3 w-3" /> Video Source
              </div>
              <div className="text-sm text-gray-400 italic">None Selected</div>
            </div>
            <button className="btn-glow fade-up mt-auto rounded-xl py-4 text-sm font-bold tracking-widest uppercase delay-2">
              Initialize Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
