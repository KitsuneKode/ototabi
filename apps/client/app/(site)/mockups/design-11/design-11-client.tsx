"use client";

import { Video } from "@/lib/icons";

export default function Design11ClientPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F5] p-6 font-sans text-[#3D3D3D]">
      <style>{`
        :root {
          --spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
          --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
        }
        .clay-card {
          background: #FFFFFF;
          border-radius: 32px;
          box-shadow: 8px 8px 24px rgba(214, 204, 196, 0.6), -8px -8px 24px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
        .clay-btn {
          background: #FF8B66; color: white; border-radius: 100px;
          box-shadow: 6px 6px 16px rgba(255, 139, 102, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.4), inset -2px -2px 6px rgba(0, 0, 0, 0.1);
          transition: transform 150ms var(--ease-out), box-shadow 150ms ease;
        }
        .clay-btn:active {
          transform: scale(0.95);
          box-shadow: 2px 2px 8px rgba(255, 139, 102, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.8), inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.4);
        }
        .clay-inner {
          background: #FDF8F5; border-radius: 24px;
          box-shadow: inset 6px 6px 12px rgba(214, 204, 196, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.9);
        }
        .pop-in { animation: popIn 600ms var(--spring) both; }
        .pop-in:nth-child(1) { animation-delay: 50ms; }
        .pop-in:nth-child(2) { animation-delay: 100ms; }
        .pop-in:nth-child(3) { animation-delay: 150ms; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.8) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <header className="pop-in mb-8 flex items-center justify-between">
        <div className="clay-card flex items-center gap-2 px-6 py-3 text-xl font-bold text-[#FF8B66]">
          <div className="h-3 w-3 animate-pulse rounded-full bg-[#FF8B66]" />
          Ototabi
        </div>
        <div className="clay-card px-4 py-2 text-sm font-semibold text-gray-400">Mockup 11</div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-12">
          <div className="clay-card pop-in col-span-12 flex h-[400px] flex-col p-4 md:col-span-8">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="text-lg font-bold">Studio Preview</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                Offline
              </span>
            </div>
            <div className="clay-inner flex flex-1 flex-col items-center justify-center">
              <Video className="mb-4 h-12 w-12 text-[#D6CCC4]" />
              <span className="text-sm font-semibold text-gray-400">Waiting for camera...</span>
            </div>
          </div>
          <div className="pop-in col-span-12 flex flex-col gap-6 md:col-span-4">
            <div className="clay-card flex h-full flex-col gap-4 p-6">
              <div className="mb-2 text-lg font-bold">Devices</div>
              <div className="clay-inner cursor-pointer p-4 transition-transform hover:scale-[1.02]">
                <div className="mb-1 text-xs font-bold text-[#FF8B66]">Microphone</div>
                <div className="text-sm font-semibold text-gray-700">Default Audio Input</div>
              </div>
              <div className="clay-inner cursor-pointer p-4 transition-transform hover:scale-[1.02]">
                <div className="mb-1 text-xs font-bold text-gray-400">Speaker</div>
                <div className="text-sm font-semibold text-gray-700">System Audio Output</div>
              </div>
              <button type="button" className="clay-btn mt-auto w-full py-5 text-lg font-bold">
                Join Room
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
