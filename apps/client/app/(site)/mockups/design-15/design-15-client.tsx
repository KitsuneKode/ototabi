"use client";

import { VideoOff } from "@/lib/icons";

export default function Design15ClientPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] p-4 font-sans text-[#ffffff]">
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/40 via-black to-black" />
      <div className="sleek-panel fade-enter relative z-10 flex w-full max-w-2xl flex-col items-center p-8 shadow-2xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner">
          <VideoOff className="h-7 w-7 text-blue-500" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Ototabi Studio</h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Join the session "Weekly Sync". Your camera is currently off.
        </p>
        <div className="relative mb-8 flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-black/50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <span className="text-xs font-medium text-gray-500">OFF</span>
          </div>
        </div>
        <div className="fade-enter mb-8 flex w-full flex-col gap-3 delay-1">
          <button
            type="button"
            className="sleek-panel sleek-btn flex w-full items-center justify-between p-4 hover:bg-white/5"
          >
            <span className="text-sm font-medium">Microphone</span>
            <span className="flex items-center gap-2 text-sm text-gray-400">Built-in</span>
          </button>
          <button
            type="button"
            className="sleek-panel sleek-btn flex w-full items-center justify-between p-4 hover:bg-white/5"
          >
            <span className="text-sm font-medium">Camera</span>
            <span className="flex items-center gap-2 text-sm text-gray-400">FaceTime HD</span>
          </button>
        </div>
        <div className="fade-enter flex w-full gap-4 delay-1">
          <button
            type="button"
            className="sleek-btn flex-1 rounded-xl bg-white/10 py-3.5 text-sm font-semibold hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            type="button"
            className="sleek-btn-primary sleek-btn flex-1 rounded-xl py-3.5 text-sm font-semibold"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
