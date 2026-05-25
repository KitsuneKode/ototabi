"use client";

import { Mic, VideoOff } from "@/lib/icons";

export default function MinimalEditorialMockup() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-sans text-[#111111]">
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
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-6">
        <div className="serif text-2xl font-medium tracking-tight">Ototabi</div>
        <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
          Design 10 / Editorial
        </span>
      </header>
      <main className="mx-auto mt-10 flex w-full max-w-4xl flex-1 flex-col items-center p-8">
        <div className="stagger-enter flex w-full flex-col gap-10">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="serif mb-4 text-4xl font-medium">Lobby Calibration</h2>
            <p className="text-sm leading-relaxed font-light text-gray-500">
              Please confirm your audio and visual inputs before proceeding into the studio
              recording session. Quality begins with clarity.
            </p>
          </div>
          <div className="fine-border group btn-press relative flex aspect-[21/9] w-full cursor-pointer items-center justify-center overflow-hidden bg-gray-100">
            <div className="pointer-events-none absolute inset-0 bg-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="serif flex items-center gap-3 text-lg text-gray-400 italic">
              <VideoOff className="h-5 w-5" /> Visual feed pending...
            </span>
          </div>
          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="fine-border btn-press cursor-pointer bg-white p-6 transition-colors hover:border-gray-400">
              <div className="mb-4 flex items-end justify-between">
                <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-gray-400 uppercase">
                  <Mic className="h-3 w-3" /> Source / Audio
                </span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <p className="text-sm font-medium">Studio Microphone A</p>
            </div>
            <div className="fine-border btn-press cursor-pointer bg-white p-6 transition-colors hover:border-gray-400">
              <div className="mb-4 flex items-end justify-between">
                <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-gray-400 uppercase">
                  <VideoOff className="h-3 w-3" /> Source / Video
                </span>
                <span className="h-2 w-2 rounded-full bg-gray-300" />
              </div>
              <p className="text-sm font-medium">Camera off</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button className="btn-press bg-[#111] px-10 py-4 text-sm tracking-wide text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none">
              ENTER STUDIO
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
