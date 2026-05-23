"use client";

import { Mic, Video, VideoOff } from 'lucide-react';

export default function GlassAuroraMockup() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col relative overflow-x-hidden font-sans">
      <style>{`
        :root {
          --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
        }
        .orb-1 {
          position: absolute; top: -10%; left: 10%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(0,0,0,0) 70%);
          filter: blur(60px); z-index: 0; pointer-events: none;
        }
        .orb-2 {
          position: absolute; bottom: -10%; right: 10%; width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%);
          filter: blur(80px); z-index: 0; pointer-events: none;
        }
        .animate-enter {
          opacity: 0;
          transform: scale(0.96) translateY(12px);
          animation: enter 600ms var(--ease-out) forwards;
        }
        .delay-1 { animation-delay: 80ms; }
        .delay-2 { animation-delay: 160ms; }
        .delay-3 { animation-delay: 240ms; }
        @keyframes enter {
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .btn-polished {
          transition: transform 160ms var(--ease-out), filter 200ms ease, opacity 200ms ease, background-color 200ms ease;
        }
        .btn-polished:active { transform: scale(0.97); }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <div className="orb-1" />
      <div className="orb-2" />
      <header className="relative z-10 glass-panel px-6 py-4 flex justify-between items-center m-4 rounded-2xl animate-enter">
        <div className="flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <h1 className="text-sm font-semibold tracking-wide">
            Ototabi <span className="text-zinc-500 ml-1">Studio</span>
          </h1>
        </div>
        <span className="text-xs text-zinc-500 font-medium px-3 py-1 bg-white/5 rounded-full border border-white/10">Design 09 // Glass Aurora</span>
      </header>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <div className="w-full glass-panel rounded-[2rem] p-10 flex flex-col gap-8 animate-enter delay-1">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
              Ready to join?
            </h2>
            <p className="text-sm text-zinc-400">Configure your devices before entering the workspace.</p>
          </div>
          <div className="relative w-full aspect-video rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center overflow-hidden animate-enter delay-2">
            <VideoOff className="w-12 h-12 text-zinc-600 mb-4" />
            <span className="text-sm font-medium text-zinc-500">Camera preview inactive</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter delay-3">
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-2 hover:bg-white/[0.04] cursor-pointer btn-polished">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-2"><Mic className="w-3 h-3" /> Audio Input</span>
              <p className="text-sm text-zinc-200">Default Microphone</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 flex flex-col gap-2 hover:bg-white/[0.04] cursor-pointer btn-polished">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-2"><Video className="w-3 h-3" /> Video Input</span>
              <p className="text-sm text-zinc-200">FaceTime HD Camera</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 animate-enter delay-3">
            <button className="btn-polished text-zinc-400 hover:text-white px-4 py-2 text-sm font-medium">Cancel</button>
            <button className="btn-polished bg-white text-black px-8 py-3 rounded-full text-sm font-semibold hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              Join Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
