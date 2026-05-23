"use client";

import { Mic, VideoOff } from 'lucide-react';

export default function MinimalEditorialMockup() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#111111] font-sans">
      <style>{`
        :root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); }
        .stagger-enter > * {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp 500ms var(--ease-out) forwards;
        }
        .stagger-enter > *:nth-child(1) { animation-delay: 50ms; }
        .stagger-enter > *:nth-child(2) { animation-delay: 100ms; }
        .stagger-enter > *:nth-child(3) { animation-delay: 150ms; }
        .stagger-enter > *:nth-child(4) { animation-delay: 200ms; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .btn-press { transition: transform 150ms var(--ease-out), background-color 200ms ease; }
        .btn-press:active { transform: scale(0.96); }
        .fine-border { border: 1px solid #E5E5E5; }
        .serif { font-family: 'Times New Roman', Times, serif; }
      `}</style>
      <header className="border-b border-gray-200 px-8 py-6 flex justify-between items-center bg-white">
        <div className="text-2xl font-medium serif tracking-tight">Ototabi</div>
        <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">Design 10 / Editorial</span>
      </header>
      <main className="flex-1 flex flex-col items-center p-8 max-w-4xl mx-auto w-full mt-10">
        <div className="w-full flex flex-col gap-10 stagger-enter">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-4xl serif font-medium mb-4">Lobby Calibration</h2>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              Please confirm your audio and visual inputs before proceeding into the studio recording session. Quality begins with clarity.
            </p>
          </div>
          <div className="w-full aspect-[21/9] bg-gray-100 fine-border flex items-center justify-center relative overflow-hidden group btn-press cursor-pointer">
            <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <span className="serif italic text-gray-400 text-lg flex items-center gap-3">
              <VideoOff className="w-5 h-5" /> Visual feed pending...
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
            <div className="fine-border p-6 hover:border-gray-400 transition-colors cursor-pointer btn-press bg-white">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Mic className="w-3 h-3" /> Source / Audio</span>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="text-sm font-medium">Studio Microphone A</p>
            </div>
            <div className="fine-border p-6 hover:border-gray-400 transition-colors cursor-pointer btn-press bg-white">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><VideoOff className="w-3 h-3" /> Source / Video</span>
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
              <p className="text-sm font-medium">Camera off</p>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button className="btn-press bg-[#111] text-white px-10 py-4 text-sm tracking-wide hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
              ENTER STUDIO
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
