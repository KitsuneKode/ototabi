"use client";

import { Mic, VideoOff } from 'lucide-react';

export default function SoftNeumorphicMockup() {
  return (
    <div className="min-h-screen flex flex-col p-8 items-center justify-center relative bg-[#e0e5ec] text-[#4a5568] font-sans">
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
      <header className="absolute top-8 left-8 right-8 flex justify-between items-center fade-up">
        <div className="text-xl font-semibold tracking-wide text-teal-600 flex items-center gap-2">
          <div className="neu-pressed w-8 h-8 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-teal-500 rounded-full" />
          </div>
          Ototabi
        </div>
        <div className="text-sm font-medium opacity-60">Design 13: Neumorphic</div>
      </header>
      <main className="w-full max-w-3xl neu-flat p-10 flex flex-col gap-8 fade-up delay-1 mt-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Configure Setup</h2>
          <p className="text-sm opacity-70">Adjust your peripherals before you start.</p>
        </div>
        <div className="neu-pressed w-full aspect-video flex flex-col items-center justify-center relative overflow-hidden">
          <VideoOff className="w-12 h-12 text-teal-500/50 mb-3" />
          <span className="text-sm font-medium">Camera Disabled</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="neu-btn p-6 flex-1 flex items-center gap-4 active">
            <div className="w-10 h-10 neu-pressed rounded-full flex items-center justify-center text-teal-500">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold opacity-60">MIC</div>
              <div className="text-sm font-semibold">Realtek Audio</div>
            </div>
          </div>
          <div className="neu-btn p-6 flex-1 flex items-center gap-4">
            <div className="w-10 h-10 neu-flat rounded-full flex items-center justify-center text-gray-400">
              <VideoOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold opacity-60">CAM</div>
              <div className="text-sm font-semibold">None</div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button className="neu-btn px-12 py-4 text-teal-600 font-bold tracking-wide hover:text-teal-500">
            JOIN ROOM
          </button>
        </div>
      </main>
    </div>
  );
}
