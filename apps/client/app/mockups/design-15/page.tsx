"use client";

import { VideoOff } from 'lucide-react';

export default function SpaceSleekMockup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#000000] text-[#ffffff] font-sans">
      <style>{`
        :root { --ease-ios: cubic-bezier(0.32, 0.72, 0, 1); --ease-button: cubic-bezier(0.25, 1, 0.5, 1); }
        .sleek-panel {
          background: rgba(28, 28, 30, 0.6); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px;
        }
        .sleek-btn { transition: transform 150ms var(--ease-button), background-color 200ms ease; }
        .sleek-btn:active { transform: scale(0.97); }
        .sleek-btn-primary { background: linear-gradient(180deg, #007AFF 0%, #0056B3 100%); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2); }
        .fade-enter { opacity: 0; transform: scale(0.98); animation: fadeEnter 400ms var(--ease-ios) forwards; }
        .delay-1 { animation-delay: 100ms; }
        @keyframes fadeEnter { to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/40 via-black to-black pointer-events-none" />
      <div className="w-full max-w-2xl sleek-panel p-8 relative z-10 flex flex-col items-center fade-enter shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
          <VideoOff className="w-7 h-7 text-blue-500" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Ototabi Studio</h1>
        <p className="text-gray-400 mb-8 text-center text-sm">Join the session "Weekly Sync". Your camera is currently off.</p>
        <div className="w-full bg-black/50 border border-white/10 rounded-xl aspect-video flex flex-col items-center justify-center mb-8 relative">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
            <span className="text-gray-500 font-medium text-xs">OFF</span>
          </div>
        </div>
        <div className="flex flex-col w-full gap-3 mb-8 fade-enter delay-1">
          <button className="sleek-panel w-full p-4 flex justify-between items-center sleek-btn hover:bg-white/5">
            <span className="font-medium text-sm">Microphone</span>
            <span className="text-gray-400 text-sm flex items-center gap-2">Built-in</span>
          </button>
          <button className="sleek-panel w-full p-4 flex justify-between items-center sleek-btn hover:bg-white/5">
            <span className="font-medium text-sm">Camera</span>
            <span className="text-gray-400 text-sm flex items-center gap-2">FaceTime HD</span>
          </button>
        </div>
        <div className="flex gap-4 w-full fade-enter delay-1">
          <button className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 font-semibold text-sm sleek-btn">Cancel</button>
          <button className="flex-1 py-3.5 rounded-xl sleek-btn-primary font-semibold text-sm sleek-btn">Join</button>
        </div>
      </div>
    </div>
  );
}
