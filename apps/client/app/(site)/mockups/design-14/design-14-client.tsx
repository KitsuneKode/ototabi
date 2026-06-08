"use client";

export default function Design14ClientPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d8b4e2] p-6 font-sans text-black">
      <style>{`
        :root { --ease-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1); }
        .brut-box {
          background: #fff; border: 3px solid #000; border-radius: 24px; box-shadow: 8px 8px 0 #000;
          transition: transform 150ms var(--ease-bouncy), box-shadow 150ms var(--ease-bouncy);
        }
        .brut-btn {
          background: #ffeb3b; border: 3px solid #000; border-radius: 100px; box-shadow: 4px 4px 0 #000;
          transition: transform 100ms ease-out, box-shadow 100ms ease-out; cursor: pointer;
        }
        .brut-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0 #000; }
        .brut-card {
          background: #fff; border: 3px solid #000; border-radius: 16px; box-shadow: 4px 4px 0 #000;
          cursor: pointer; transition: transform 100ms ease-out, box-shadow 100ms ease-out, background-color 200ms ease;
        }
        .brut-card:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #000; }
        .brut-card.selected { background: #a8e6cf; }
        .enter-anim { opacity: 0; transform: rotate(-2deg) translateY(20px); animation: swingIn 500ms var(--ease-bouncy) forwards; }
        .delay-1 { animation-delay: 100ms; }
        .delay-2 { animation-delay: 200ms; }
        @keyframes swingIn { to { opacity: 1; transform: rotate(0deg) translateY(0); } }
      `}</style>
      <div className="flex w-full max-w-4xl flex-col items-stretch gap-8 md:flex-row">
        <div className="brut-box enter-anim flex flex-1 flex-col p-8">
          <div className="mb-6 inline-block w-max -rotate-2 transform rounded-full bg-[#000] px-4 py-1 text-sm font-bold text-white">
            OTOTABI / MOCKUP 14
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight uppercase">GET READY</h1>
          <p className="mb-8 text-lg font-medium">Check your hair. Check your mic.</p>
          <div className="relative mb-auto flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-3 border-[3px] border-black bg-[#eee]">
            <div className="absolute h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]" />
            <span className="z-10 text-2xl font-bold text-black/20">NO VIDEO</span>
          </div>
        </div>
        <div className="enter-anim flex w-full flex-col gap-6 delay-1 md:w-80">
          <div className="brut-card selected flex flex-col gap-2 p-5">
            <span className="w-max rounded bg-black px-2 py-0.5 text-xs font-bold tracking-wider text-white uppercase">
              Mic
            </span>
            <span className="text-lg font-bold">Studio Setup</span>
          </div>
          <div className="brut-card flex flex-col gap-2 p-5">
            <span className="w-max rounded border-2 border-black px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
              Cam
            </span>
            <span className="text-lg font-bold">FaceTime HD</span>
          </div>
          <button
            type="button"
            className="brut-btn enter-anim mt-auto w-full py-5 text-xl font-bold uppercase delay-2"
          >
            Join Studio -{">"}
          </button>
        </div>
      </div>
    </div>
  );
}
