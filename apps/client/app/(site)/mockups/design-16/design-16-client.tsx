"use client";

export default function Design16ClientPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#a8a396] p-5 font-sans">
      <style>{`
        :root { --bg-color: #d1ccbd; --panel-dark: #2c2b29; --led-on: #ff4a3d; --led-off: #592420; --ease-mechanical: cubic-bezier(0.1, 0.9, 0.2, 1); }
        .analog-chassis {
          background: var(--bg-color); border-radius: 8px;
          box-shadow: inset 0 2px 5px rgba(255,255,255,0.7), 0 20px 30px rgba(0,0,0,0.4), 0 4px 0px #8f8a7e;
          border: 1px solid #706b60; padding: 30px; width: 100%; max-width: 900px;
        }
        .display-screen {
          background: #111; border: 4px solid #1a1a1a; border-radius: 8px; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); position: relative;
        }
        .display-screen::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%); background-size: 100% 4px; pointer-events: none;
        }
        .analog-btn {
          background: linear-gradient(180deg, #e6e2d3 0%, #b8b3a3 100%); border: 1px solid #827e71; border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.8);
          color: #333; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;
          transition: transform 100ms var(--ease-mechanical), box-shadow 100ms var(--ease-mechanical); cursor: pointer;
        }
        .analog-btn:active { transform: translateY(3px); box-shadow: 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 4px rgba(0,0,0,0.3); }
        .led {
          width: 12px; height: 12px; border-radius: 50%; background: var(--led-off); box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
          transition: background-color 200ms ease, box-shadow 200ms ease;
        }
        .led.active { background: var(--led-on); box-shadow: 0 0 10px var(--led-on), inset 0 2px 4px rgba(255,255,255,0.4); }
        .label { font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #4a4843; text-transform: uppercase; }
        .slide-in { animation: slideIn 500ms var(--ease-mechanical) forwards; }
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div className="analog-chassis slide-in w-full max-w-4xl">
        <div className="mb-8 flex items-end justify-between border-b-2 border-[#a39f93] pb-4">
          <div>
            <h1 className="m-0 text-4xl leading-none font-bold tracking-tight text-[#2c2b29]">
              OTOTABI
            </h1>
            <span className="label mt-1 block">Model 16-A // Studio Controller</span>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="led active" />
              <span className="label">PWR</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="led active animate-pulse" />
              <span className="label">RDY</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="display-screen flex aspect-video flex-col items-center justify-center p-4 md:col-span-8">
            <div className="text-center font-mono text-sm tracking-widest text-[#888]">
              [ SIGNAL LOST ]<br />
              <br />
              CHECK VIDEO INPUT
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-lg border border-[#969285] bg-[#b5b0a1] p-6 shadow-inner md:col-span-4">
            <div className="flex flex-col gap-2">
              <span className="label">INPUT 1: AUDIO</span>
              <div className="flex items-center gap-3 rounded border border-[#8a867b] bg-[#a39f93] p-2 shadow-inner">
                <div className="led active" />
                <span className="text-sm font-bold text-[#2c2b29]">MAIN MIC</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label">INPUT 2: VIDEO</span>
              <div className="flex items-center gap-3 rounded border border-[#8a867b] bg-[#a39f93] p-2 shadow-inner">
                <div className="led" />
                <span className="text-sm font-bold text-[#555]">OFFLINE</span>
              </div>
            </div>
            <div className="mt-auto border-t-2 border-[#a39f93] pt-6">
              <span className="label mb-3 block text-center">ENGAGE SEQUENCE</span>
              <button type="button" className="analog-btn w-full py-4 text-lg">
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
