"use client";

export default function BoldBrutalistMockup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#d8b4e2] text-black font-sans">
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
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-stretch">
        <div className="brut-box flex-1 flex flex-col p-8 enter-anim">
          <div className="inline-block bg-[#000] text-white px-4 py-1 rounded-full text-sm font-bold w-max mb-6 transform -rotate-2">
            OTOTABI / MOCKUP 14
          </div>
          <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight">GET READY</h1>
          <p className="text-lg mb-8 font-medium">Check your hair. Check your mic.</p>
          <div className="w-full bg-[#eee] border-3 border-black rounded-xl aspect-video flex items-center justify-center mb-auto relative overflow-hidden border-[3px]">
            <div className="absolute w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]" />
            <span className="font-bold text-2xl text-black/20 z-10">NO VIDEO</span>
          </div>
        </div>
        <div className="flex flex-col gap-6 w-full md:w-80 enter-anim delay-1">
          <div className="brut-card selected p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded w-max">Mic</span>
            <span className="font-bold text-lg">Studio Setup</span>
          </div>
          <div className="brut-card p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider border-2 border-black px-2 py-0.5 rounded w-max">Cam</span>
            <span className="font-bold text-lg">FaceTime HD</span>
          </div>
          <button className="brut-btn mt-auto w-full py-5 text-xl font-bold uppercase enter-anim delay-2">
            Join Studio -{'>'}
          </button>
        </div>
      </div>
    </div>
  );
}
