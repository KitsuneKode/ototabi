"use client";

import { Mic, VideoOff } from "lucide-react";

export default function SoftNeumorphicMockup() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#e0e5ec] p-8 font-sans text-[#4a5568]">
      <style>{`
        :root { --bg-color: #e0e5ec; --shadow-light: #ffffff; --shadow-dark: #a3b1c6; --ease-out: cubic-bezier(0.23, 1, 0.32, 1); }
        .neu-flat { background: var(--bg-color); box-shadow: 9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light); border-radius: 20px; }
        .neu-pressed { background: var(--bg-color); box-shadow: inset 6px 6px 10px var(--shadow-dark), inset -6px -6px 10px var(--shadow-light); border-radius: 20px; }
        .neu-btn {
          background: var(--bg-color); box-shadow: 6px 6px 10px var(--shadow-dark), -6px -6px 10px var(--shadow-light);
          border-radius: 50px; transition: all 200ms var(--ease-out); cursor: pointer;
        }
        .neu-btn:active, .neu-btn.active { box-shadow: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light); transform: scale(0.98); }
        .fade-up { opacity: 0; transform: translateY(15px); animation: fadeUp 600ms var(--ease-out) forwards; }
        .delay-1 { animation-delay: 150ms; }
        .delay-2 { animation-delay: 300ms; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <header className="fade-up absolute top-8 right-8 left-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold tracking-wide text-teal-600">
          <div className="neu-pressed flex h-8 w-8 items-center justify-center rounded-full">
            <div className="h-3 w-3 rounded-full bg-teal-500" />
          </div>
          Ototabi
        </div>
        <div className="text-sm font-medium opacity-60">Design 13: Neumorphic</div>
      </header>
      <main className="neu-flat fade-up mt-12 flex w-full max-w-3xl flex-col gap-8 p-10 delay-1">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Configure Setup</h2>
          <p className="text-sm opacity-70">Adjust your peripherals before you start.</p>
        </div>
        <div className="neu-pressed relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden">
          <VideoOff className="mb-3 h-12 w-12 text-teal-500/50" />
          <span className="text-sm font-medium">Camera Disabled</span>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="neu-btn active flex flex-1 items-center gap-4 p-6">
            <div className="neu-pressed flex h-10 w-10 items-center justify-center rounded-full text-teal-500">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold opacity-60">MIC</div>
              <div className="text-sm font-semibold">Realtek Audio</div>
            </div>
          </div>
          <div className="neu-btn flex flex-1 items-center gap-4 p-6">
            <div className="neu-flat flex h-10 w-10 items-center justify-center rounded-full text-gray-400">
              <VideoOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold opacity-60">CAM</div>
              <div className="text-sm font-semibold">None</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <button className="neu-btn px-12 py-4 font-bold tracking-wide text-teal-600 hover:text-teal-500">
            JOIN ROOM
          </button>
        </div>
      </main>
    </div>
  );
}
