"use client";

import { useState, useEffect, useRef } from "react";

import { MockupsExploratoryBanner } from "@/components/marketing/mockups-exploratory-banner";
import {
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Code,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  X,
  FileText,
} from "@/lib/icons";

interface DesignPreset {
  id: number;
  name: string;
  file: string;
  category: string;
  desc: string;
  theme: string;
}

const DESIGNS: DesignPreset[] = [
  {
    id: 1,
    name: "Cyber Emerald",
    file: "design-1-cyber-emerald.html",
    category: "Neo-Brutalist",
    desc: "Raw Neo-Brutalist dark theme with thick black borders, emerald accents, and monospace type.",
    theme: "Dark / High Contrast",
  },
  {
    id: 2,
    name: "Mono Sand",
    file: "design-2-mono-sand.html",
    category: "Minimalist Serif",
    desc: "Light, refined minimalist paper look with warm charcoal, serif headings, and wide space margins.",
    theme: "Light / Serif",
  },
  {
    id: 3,
    name: "Synth Vapor",
    file: "design-3-synth-vapor.html",
    category: "Retrowave",
    desc: "Retro-futuristic retrowave theme with glowing cyber-cyan, neon pink grids, and scanlines.",
    theme: "Dark / Neon Glow",
  },
  {
    id: 4,
    name: "Helvetica Noir",
    file: "design-4-helvetica-noir.html",
    category: "Stark Editorial",
    desc: "Stark black-and-white asymmetric layout with bold line divisions and heavy typography.",
    theme: "Monochrome / Minimal",
  },
  {
    id: 5,
    name: "Tactical Rust",
    file: "design-5-tactical-rust.html",
    category: "Industrial Console",
    desc: "Industrial military console theme with warning hazard orange highlights, technical borders, and crosshairs.",
    theme: "Dark / Utilitarian",
  },
  {
    id: 6,
    name: "Obsidian Gold",
    file: "design-6-obsidian-gold.html",
    category: "Luxury Dark",
    desc: "Luxury premium dark style with champagne gold hairline accents, translucent cards, and soft Garamond type.",
    theme: "Dark / Premium",
  },
  {
    id: 7,
    name: "Pastel Blob",
    file: "design-7-pastel-blob.html",
    category: "Playful Claymorphic",
    desc: "Playful round claymorphic card layout with lilac/mint/peach pastel tones and bubble triggers.",
    theme: "Color / Rounded",
  },
  {
    id: 8,
    name: "Bauhaus Primary",
    file: "design-8-bauhaus-primary.html",
    category: "Swiss Grid",
    desc: "Modernist Bauhaus layout utilizing stark borders, primary color indicators, and strict grids.",
    theme: "Light / Swiss Modern",
  },
  {
    id: 9,
    name: "Glass Aurora",
    file: "design-9",
    category: "Glassmorphism",
    desc: "Elegant dark glassmorphism with glowing neon backdrops and sleek premium controls.",
    theme: "Dark / Translucent",
  },
  {
    id: 10,
    name: "Minimal Editorial",
    file: "design-10",
    category: "Modern Serif",
    desc: "Serif-driven high-fashion editorial grid with extreme whitespace and fine lines.",
    theme: "Light / Editorial",
  },
  {
    id: 11,
    name: "Clay Bento",
    file: "design-11",
    category: "Bento 3D",
    desc: "Warm claymorphic 3D cards in a Bento layout with smooth spring animations.",
    theme: "Color / Neumorphic",
  },
  {
    id: 12,
    name: "Midnight Glow",
    file: "design-12",
    category: "Cosmic Cyberpunk",
    desc: "Deep cosmic backdrop with cyan border glows, clean Outfit typography, and subtle tech elements.",
    theme: "Dark / High Glow",
  },
  {
    id: 13,
    name: "Soft Neumorphic",
    file: "design-13",
    category: "Light Neumorphic",
    desc: "Extremely soft tactile light-theme card UI with extruded buttons and responsive sliders.",
    theme: "Light / Tactile",
  },
  {
    id: 14,
    name: "Bold Brutalist",
    file: "design-14",
    category: "High Contrast",
    desc: "Aggressive, raw brutalism with solid fills, offset boxes, and thick borders.",
    theme: "Dark / Brutalist",
  },
  {
    id: 15,
    name: "Space Sleek",
    file: "design-15",
    category: "Sci-Fi HUD",
    desc: "Futuristic sci-fi dashboard theme with layout lines and minimalist neon status guides.",
    theme: "Dark / HUD",
  },
  {
    id: 16,
    name: "Retro Analog",
    file: "design-16",
    category: "Nostalgic Beige",
    desc: "Vibrant, nostalgia-inducing layout with warm beige paper, orange grid overlays, and pixel buttons.",
    theme: "Light / Analog",
  },
  {
    id: 17,
    name: "Signal Lock",
    file: "design-17",
    category: "Instrument UI",
    desc: "Void black + phosphor green meters. Precision-tool trust for technical creators.",
    theme: "Dark / Minimal",
  },
  {
    id: 18,
    name: "Tape Archive",
    file: "design-18",
    category: "Editorial Trust",
    desc: "Warm paper, serif headlines, reel metaphor. Calm conversion for interview podcasts.",
    theme: "Light / Heritage",
  },
  {
    id: 19,
    name: "Patchbay Pro",
    file: "design-19",
    category: "Studio Rack",
    desc: "Evolved Studio Console: gunmetal chassis, amber REC, live waveform in CRT. Recommended default.",
    theme: "Dark / Analog+",
  },
  {
    id: 20,
    name: "Timeline Master",
    file: "design-20",
    category: "Edit-First",
    desc: "Waveform hero + multi-track lanes. Sells aligned masters and post-production.",
    theme: "Dark / Cyan",
  },
];

export default function MockupsPage() {
  const [selectedDesign, setSelectedDesign] = useState<number>(1);
  const [viewportSize, setViewportSize] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeDesign = (DESIGNS.find((d) => d.id === selectedDesign) || DESIGNS[0]) as DesignPreset;

  // Fetch design code when code inspector is open
  useEffect(() => {
    if (showCode && activeDesign) {
      setCodeContent("Loading code content...");
      fetch(`/mockups/${activeDesign.file}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load code");
          return res.text();
        })
        .then((text) => setCodeContent(text))
        .catch((err) => setCodeContent(`Error loading code file: ${err.message}`));
    }
  }, [showCode, selectedDesign, activeDesign]);

  const handleCopyCode = () => {
    if (codeContent) {
      navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReload = () => {
    setIsIframeLoading(true);
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-none">
      <div className="relative z-50 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <MockupsExploratoryBanner />
      </div>
      {/* Top Header Hub */}
      <header className="relative z-40 flex w-full items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
            <Sliders className="h-5 w-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-sm font-black tracking-[0.2em] text-white uppercase">
              OTOTABI DESIGN LAB
              <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 font-mono text-xs text-[9px] tracking-normal text-emerald-400 uppercase">
                Aesthetic Playground
              </span>
            </h1>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
              16 custom visual design presets for rooms & onboarding lobby.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Viewport size switcher */}
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              onClick={() => setViewportSize("desktop")}
              className={`rounded p-1.5 transition-all ${
                viewportSize === "desktop"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Desktop (100% Width)"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewportSize("tablet")}
              className={`rounded p-1.5 transition-all ${
                viewportSize === "tablet"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Tablet (768px Width)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewportSize("mobile")}
              className={`rounded p-1.5 transition-all ${
                viewportSize === "mobile"
                  ? "bg-zinc-800 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Mobile (375px Width)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleReload}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
            title="Reload Design"
          >
            <RefreshCw className={`h-4 w-4 ${isIframeLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-all ${
              showCode
                ? "border-emerald-500 bg-emerald-500 font-bold text-black shadow-md"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Code className="h-4 w-4" />
            <span>{showCode ? "Close Code" : "View HTML"}</span>
          </button>

          <a
            href={`/mockups/${activeDesign.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400 transition-all hover:bg-zinc-900 hover:text-white"
            title="Open raw mockup page in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Launch Raw</span>
          </a>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Side: Preset selector */}
        <aside className="flex w-80 shrink-0 scrollbar-thin flex-col overflow-y-auto border-r border-zinc-900 bg-zinc-950 select-none">
          <div className="border-b border-zinc-900/60 bg-zinc-950/40 p-4">
            <span className="mb-1 block text-[9px] font-black tracking-widest text-zinc-500 uppercase">
              Select Preset
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
              <span>Aesthetic Options</span>
              <span className="font-bold text-emerald-400">{selectedDesign} of 16</span>
            </div>
          </div>

          <div className="flex-1 space-y-1 p-2">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDesign(d.id);
                  setIsIframeLoading(true);
                }}
                className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all duration-150 ${
                  selectedDesign === d.id
                    ? "border-zinc-700 bg-zinc-900 shadow-inner"
                    : "border-transparent bg-transparent text-zinc-400 hover:border-zinc-900 hover:bg-zinc-900/50 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${selectedDesign === d.id ? "text-emerald-400" : "text-zinc-500"}`}
                  >
                    {String(d.id).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
                      selectedDesign === d.id
                        ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {d.category}
                  </span>
                </div>
                <h3
                  className={`text-xs font-black tracking-wider uppercase ${selectedDesign === d.id ? "text-white" : "text-zinc-300"}`}
                >
                  {d.name}
                </h3>
                <p className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-zinc-500">
                  {d.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Quick info footer */}
          <div className="sticky bottom-0 border-t border-zinc-900 bg-zinc-950/80 p-4">
            <div className="space-y-1 rounded-lg border border-zinc-800/40 bg-zinc-900/40 p-3">
              <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Active Theme Specs
              </div>
              <p className="font-mono text-[10px] text-zinc-300">
                <span className="text-zinc-500">Preset Style:</span> {activeDesign.theme}
              </p>
            </div>
          </div>
        </aside>

        {/* Center: Live Iframe Preview Panel */}
        <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-900/20 p-6">
          {/* Subtle Grid overlay background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(#FFF 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Iframe stage wrapper */}
          <div
            className={`relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all duration-300 ${
              viewportSize === "desktop"
                ? "h-full w-full"
                : viewportSize === "tablet"
                  ? "h-[90%] w-[768px] border-4 border-zinc-800"
                  : "h-[90%] w-[375px] border-4 border-zinc-800"
            }`}
          >
            {/* Fake browser bar header */}
            <div className="flex w-full shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800"></div>
                <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800"></div>
                <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800"></div>
              </div>
              <div className="w-72 truncate rounded-md border border-zinc-800/80 bg-zinc-950 px-4 py-0.5 text-center font-mono text-[10px] text-zinc-500">
                http://localhost:3000/mockups/{activeDesign.file}
              </div>
              <div className="animate-pulse rounded border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-emerald-500/80 uppercase">
                LIVE STAGE
              </div>
            </div>

            {/* Live mockup frame */}
            <div className="relative h-full w-full flex-1 bg-zinc-950">
              {/* Spinner loader indicator */}
              {isIframeLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-zinc-950">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400"></div>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    Loading preset assets...
                  </span>
                </div>
              )}

              <iframe
                ref={iframeRef}
                key={activeDesign.id}
                src={`/mockups/${activeDesign.file}`}
                onLoad={handleIframeLoad}
                className="relative z-10 h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-modals"
                loading="lazy"
              />
            </div>
          </div>
        </main>

        {/* Right Side / Drawer: HTML Code Inspector */}
        {showCode && (
          <aside className="animate-in slide-in-from-right relative z-30 flex w-[500px] shrink-0 flex-col overflow-hidden border-l border-zinc-900 bg-zinc-950 shadow-2xl duration-250">
            {/* Header of code viewer */}
            <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-white uppercase">
                    Source Inspector
                  </h3>
                  <p className="font-mono text-[9px] text-zinc-500">{activeDesign.file}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCode(false)}
                className="rounded border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-900/60 bg-zinc-900/20 p-3">
              <span className="font-mono text-[10px] text-zinc-400">
                Full standalone HTML mockup code including inline styles & layouts.
              </span>
              <button
                onClick={handleCopyCode}
                className={`flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-[10px] font-bold tracking-wide transition-all ${
                  copied
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code container codebox */}
            <div className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono">
              <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre text-zinc-300 select-text">
                <code>{codeContent}</code>
              </pre>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
