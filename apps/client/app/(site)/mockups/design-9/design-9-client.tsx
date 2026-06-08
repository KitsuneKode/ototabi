"use client";

import { Mic, Video, VideoOff } from "@/lib/icons";

export default function Design9ClientPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#050505] font-sans text-zinc-100">
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
      <header className="glass-panel animate-enter relative z-10 m-4 flex items-center justify-between rounded-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <h1 className="text-sm font-semibold tracking-wide">
            Ototabi <span className="ml-1 text-zinc-500">Studio</span>
          </h1>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-500">
          Design 09 // Glass Aurora
        </span>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-6">
        <div className="glass-panel animate-enter flex w-full flex-col gap-8 rounded-[2rem] p-10 delay-1">
          <div className="flex flex-col gap-2">
            <h2 className="bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-3xl font-medium tracking-tight text-transparent">
              Ready to join?
            </h2>
            <p className="text-sm text-zinc-400">
              Configure your devices before entering the workspace.
            </p>
          </div>
          <div className="animate-enter relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] delay-2">
            <VideoOff className="mb-4 h-12 w-12 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-500">Camera preview inactive</span>
          </div>
          <div className="animate-enter grid grid-cols-1 gap-4 delay-3 md:grid-cols-2">
            <div className="glass-panel btn-polished flex cursor-pointer flex-col gap-2 rounded-2xl p-5 hover:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                <Mic className="h-3 w-3" /> Audio Input
              </span>
              <p className="text-sm text-zinc-200">Default Microphone</p>
            </div>
            <div className="glass-panel btn-polished flex cursor-pointer flex-col gap-2 rounded-2xl p-5 hover:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                <Video className="h-3 w-3" /> Video Input
              </span>
              <p className="text-sm text-zinc-200">FaceTime HD Camera</p>
            </div>
          </div>
          <div className="animate-enter flex items-center justify-between pt-4 delay-3">
            <button
              type="button"
              className="btn-polished px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-polished rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-zinc-200"
            >
              Join Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
