"use client";

import { Video } from 'lucide-react';

export default function ClayBentoMockup() {
  return (
    <div className="min-h-screen flex flex-col p-6 bg-[#FDF8F5] text-[#3D3D3D] font-sans">
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
      <header className="flex justify-between items-center mb-8 pop-in">
        <div className="clay-card px-6 py-3 font-bold text-xl text-[#FF8B66] flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF8B66] animate-pulse" />
          Ototabi
        </div>
        <div className="clay-card px-4 py-2 text-sm font-semibold text-gray-400">Mockup 11</div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          <div className="clay-card col-span-12 md:col-span-8 p-4 flex flex-col pop-in h-[400px]">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-bold text-lg">Studio Preview</h2>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Offline</span>
            </div>
            <div className="clay-inner flex-1 flex flex-col items-center justify-center">
              <Video className="w-12 h-12 text-[#D6CCC4] mb-4" />
              <span className="text-gray-400 font-semibold text-sm">Waiting for camera...</span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col gap-6 pop-in">
            <div className="clay-card p-6 flex flex-col gap-4 h-full">
              <div className="font-bold text-lg mb-2">Devices</div>
              <div className="clay-inner p-4 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="text-xs font-bold text-[#FF8B66] mb-1">Microphone</div>
                <div className="font-semibold text-sm text-gray-700">Default Audio Input</div>
              </div>
              <div className="clay-inner p-4 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="text-xs font-bold text-gray-400 mb-1">Speaker</div>
                <div className="font-semibold text-sm text-gray-700">System Audio Output</div>
              </div>
              <button className="clay-btn w-full py-5 text-lg font-bold mt-auto">Join Room</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
