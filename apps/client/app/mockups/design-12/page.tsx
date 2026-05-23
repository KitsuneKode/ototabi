"use client";

import { Settings, Shield } from 'lucide-react';

export default function MidnightGlowMockup() {
  return (
    <div className="min-h-screen flex flex-col p-6 items-center bg-[#030712] text-gray-100 font-sans relative overflow-hidden">
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#030712] to-[#030712] pointer-events-none" />
      <header className="w-full max-w-6xl flex justify-between items-center mb-12 fade-up relative z-10">
        <div className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-4 h-4 bg-[#00f0ff] rounded-sm shadow-[0_0_15px_#00f0ff]" /> OTOTABI
        </div>
        <div className="text-[#00f0ff] text-sm tracking-widest uppercase opacity-70">Design // 12</div>
      </header>
      <main className="w-full max-w-4xl flex-1 flex flex-col relative z-10 fade-up delay-1">
        <h1 className="text-5xl font-semibold mb-2">Lobby Setup</h1>
        <p className="text-gray-400 mb-10 text-lg">System diagnostics ready. Awaiting user input.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glow-border aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="text-[#00f0ff] opacity-50 font-mono text-sm tracking-wider uppercase mb-2 animate-pulse">[ NO VIDEO SIGNAL ]</div>
            <div className="w-16 h-1 border border-[#00f0ff]/30 rounded-full overflow-hidden">
              <div className="w-full h-full bg-[#00f0ff]/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="glow-border p-5 flex flex-col gap-3">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2"><Settings className="w-3 h-3" /> Audio Source</div>
              <div className="text-sm">External Mic 01</div>
              <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#00f0ff] w-2/3 shadow-[0_0_10px_#00f0ff]" />
              </div>
            </div>
            <div className="glow-border p-5 flex flex-col gap-3">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold flex items-center gap-2"><Shield className="w-3 h-3" /> Video Source</div>
              <div className="text-sm text-gray-400 italic">None Selected</div>
            </div>
            <button className="btn-glow mt-auto py-4 rounded-xl font-bold uppercase tracking-widest text-sm fade-up delay-2">
              Initialize Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
