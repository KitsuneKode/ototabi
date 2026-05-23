'use client'

import { useState, useEffect, useRef } from 'react'
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
  FileText
} from 'lucide-react'

interface DesignPreset {
  id: number
  name: string
  file: string
  category: string
  desc: string
  theme: string
}

const DESIGNS: DesignPreset[] = [
  { id: 1, name: 'Cyber Emerald', file: 'design-1-cyber-emerald.html', category: 'Neo-Brutalist', desc: 'Raw Neo-Brutalist dark theme with thick black borders, emerald accents, and monospace type.', theme: 'Dark / High Contrast' },
  { id: 2, name: 'Mono Sand', file: 'design-2-mono-sand.html', category: 'Minimalist Serif', desc: 'Light, refined minimalist paper look with warm charcoal, serif headings, and wide space margins.', theme: 'Light / Serif' },
  { id: 3, name: 'Synth Vapor', file: 'design-3-synth-vapor.html', category: 'Retrowave', desc: 'Retro-futuristic retrowave theme with glowing cyber-cyan, neon pink grids, and scanlines.', theme: 'Dark / Neon Glow' },
  { id: 4, name: 'Helvetica Noir', file: 'design-4-helvetica-noir.html', category: 'Stark Editorial', desc: 'Stark black-and-white asymmetric layout with bold line divisions and heavy typography.', theme: 'Monochrome / Minimal' },
  { id: 5, name: 'Tactical Rust', file: 'design-5-tactical-rust.html', category: 'Industrial Console', desc: 'Industrial military console theme with warning hazard orange highlights, technical borders, and crosshairs.', theme: 'Dark / Utilitarian' },
  { id: 6, name: 'Obsidian Gold', file: 'design-6-obsidian-gold.html', category: 'Luxury Dark', desc: 'Luxury premium dark style with champagne gold hairline accents, translucent cards, and soft Garamond type.', theme: 'Dark / Premium' },
  { id: 7, name: 'Pastel Blob', file: 'design-7-pastel-blob.html', category: 'Playful Claymorphic', desc: 'Playful round claymorphic card layout with lilac/mint/peach pastel tones and bubble triggers.', theme: 'Color / Rounded' },
  { id: 8, name: 'Bauhaus Primary', file: 'design-8-bauhaus-primary.html', category: 'Swiss Grid', desc: 'Modernist Bauhaus layout utilizing stark borders, primary color indicators, and strict grids.', theme: 'Light / Swiss Modern' },
  { id: 9, name: 'Glass Aurora', file: 'design-9', category: 'Glassmorphism', desc: 'Elegant dark glassmorphism with glowing neon backdrops and sleek premium controls.', theme: 'Dark / Translucent' },
  { id: 10, name: 'Minimal Editorial', file: 'design-10', category: 'Modern Serif', desc: 'Serif-driven high-fashion editorial grid with extreme whitespace and fine lines.', theme: 'Light / Editorial' },
  { id: 11, name: 'Clay Bento', file: 'design-11', category: 'Bento 3D', desc: 'Warm claymorphic 3D cards in a Bento layout with smooth spring animations.', theme: 'Color / Neumorphic' },
  { id: 12, name: 'Midnight Glow', file: 'design-12', category: 'Cosmic Cyberpunk', desc: 'Deep cosmic backdrop with cyan border glows, clean Outfit typography, and subtle tech elements.', theme: 'Dark / High Glow' },
  { id: 13, name: 'Soft Neumorphic', file: 'design-13', category: 'Light Neumorphic', desc: 'Extremely soft tactile light-theme card UI with extruded buttons and responsive sliders.', theme: 'Light / Tactile' },
  { id: 14, name: 'Bold Brutalist', file: 'design-14', category: 'High Contrast', desc: 'Aggressive, raw brutalism with solid fills, offset boxes, and thick borders.', theme: 'Dark / Brutalist' },
  { id: 15, name: 'Space Sleek', file: 'design-15', category: 'Sci-Fi HUD', desc: 'Futuristic sci-fi dashboard theme with layout lines and minimalist neon status guides.', theme: 'Dark / HUD' },
  { id: 16, name: 'Retro Analog', file: 'design-16', category: 'Nostalgic Beige', desc: 'Vibrant, nostalgia-inducing layout with warm beige paper, orange grid overlays, and pixel buttons.', theme: 'Light / Analog' }
]

export default function MockupsPage() {
  const [selectedDesign, setSelectedDesign] = useState<number>(1)
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isIframeLoading, setIsIframeLoading] = useState(true)
  const [showCode, setShowCode] = useState(false)
  const [codeContent, setCodeContent] = useState('')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const activeDesign = (DESIGNS.find((d) => d.id === selectedDesign) || DESIGNS[0]) as DesignPreset

  // Fetch design code when code inspector is open
  useEffect(() => {
    if (showCode && activeDesign) {
      setCodeContent('Loading code content...')
      fetch(`/mockups/${activeDesign.file}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load code')
          return res.text()
        })
        .then((text) => setCodeContent(text))
        .catch((err) => setCodeContent(`Error loading code file: ${err.message}`))
    }
  }, [showCode, selectedDesign, activeDesign])

  const handleCopyCode = () => {
    if (codeContent) {
      navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReload = () => {
    setIsIframeLoading(true)
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleIframeLoad = () => {
    setIsIframeLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Hub */}
      <header className="w-full bg-zinc-900 border-b border-zinc-800 p-4 z-40 relative flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Sliders className="h-5 w-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              OTOTABI DESIGN LAB
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono tracking-normal px-2 py-0.5 rounded border border-emerald-500/30 uppercase text-[9px]">
                Aesthetic Playground
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              16 custom visual design presets for rooms & onboarding lobby.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Viewport size switcher */}
          <div className="bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex gap-1">
            <button
              onClick={() => setViewportSize('desktop')}
              className={`p-1.5 rounded transition-all ${
                viewportSize === 'desktop'
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Desktop (100% Width)"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewportSize('tablet')}
              className={`p-1.5 rounded transition-all ${
                viewportSize === 'tablet'
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tablet (768px Width)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewportSize('mobile')}
              className={`p-1.5 rounded transition-all ${
                viewportSize === 'mobile'
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Mobile (375px Width)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleReload}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 active:scale-95 transition-all text-zinc-400 hover:text-white"
            title="Reload Design"
          >
            <RefreshCw className={`h-4 w-4 ${isIframeLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-semibold tracking-wide transition-all ${
              showCode
                ? 'bg-emerald-500 text-black border-emerald-500 shadow-md font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Code className="h-4 w-4" />
            <span>{showCode ? 'Close Code' : 'View HTML'}</span>
          </button>

          <a
            href={`/mockups/${activeDesign.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
            title="Open raw mockup page in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Launch Raw</span>
          </a>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Preset selector */}
        <aside className="w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col overflow-y-auto shrink-0 select-none scrollbar-thin">
          <div className="p-4 border-b border-zinc-900/60 bg-zinc-950/40">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">
              Select Preset
            </span>
            <div className="text-xs text-zinc-400 flex justify-between items-center font-mono">
              <span>Aesthetic Options</span>
              <span className="text-emerald-400 font-bold">{selectedDesign} of 16</span>
            </div>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDesign(d.id)
                  setIsIframeLoading(true)
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex flex-col gap-1 ${
                  selectedDesign === d.id
                    ? 'bg-zinc-900 border-zinc-700 shadow-inner'
                    : 'bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-900 hover:text-zinc-200 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${selectedDesign === d.id ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {String(d.id).padStart(2, '0')}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                    selectedDesign === d.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {d.category}
                  </span>
                </div>
                <h3 className={`text-xs font-black uppercase tracking-wider ${selectedDesign === d.id ? 'text-white' : 'text-zinc-300'}`}>
                  {d.name}
                </h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono line-clamp-2 mt-0.5">
                  {d.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Quick info footer */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 sticky bottom-0">
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/40 space-y-1">
              <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Active Theme Specs
              </div>
              <p className="text-[10px] font-mono text-zinc-300">
                <span className="text-zinc-500">Preset Style:</span> {activeDesign.theme}
              </p>
            </div>
          </div>
        </aside>

        {/* Center: Live Iframe Preview Panel */}
        <main className="flex-1 bg-zinc-900/20 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle Grid overlay background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#FFF 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

          {/* Iframe stage wrapper */}
          <div
            className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden relative ${
              viewportSize === 'desktop'
                ? 'w-full h-full'
                : viewportSize === 'tablet'
                ? 'w-[768px] h-[90%] border-4 border-zinc-800'
                : 'w-[375px] h-[90%] border-4 border-zinc-800'
            }`}
          >
            {/* Fake browser bar header */}
            <div className="w-full bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
              </div>
              <div className="bg-zinc-950 px-4 py-0.5 border border-zinc-800/80 rounded-md text-[10px] text-zinc-500 font-mono w-72 text-center truncate">
                http://localhost:3000/mockups/{activeDesign.file}
              </div>
              <div className="text-[9px] uppercase font-mono font-bold tracking-widest text-emerald-500/80 animate-pulse bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                LIVE STAGE
              </div>
            </div>

            {/* Live mockup frame */}
            <div className="flex-1 w-full h-full relative bg-zinc-950">
              {/* Spinner loader indicator */}
              {isIframeLoading && (
                <div className="absolute inset-0 bg-zinc-950 z-30 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-zinc-800 border-t-emerald-400 animate-spin"></div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest">Loading preset assets...</span>
                </div>
              )}

              <iframe
                ref={iframeRef}
                key={activeDesign.id}
                src={`/mockups/${activeDesign.file}`}
                onLoad={handleIframeLoad}
                className="w-full h-full border-0 relative z-10"
                sandbox="allow-scripts allow-same-origin allow-modals"
                loading="lazy"
              />
            </div>
          </div>
        </main>

        {/* Right Side / Drawer: HTML Code Inspector */}
        {showCode && (
          <aside className="w-[500px] border-l border-zinc-900 bg-zinc-950 flex flex-col shrink-0 overflow-hidden relative z-30 shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Header of code viewer */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Source Inspector</h3>
                  <p className="text-[9px] font-mono text-zinc-500">{activeDesign.file}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCode(false)}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-3 border-b border-zinc-900/60 bg-zinc-900/20 flex gap-2 justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-400">
                Full standalone HTML mockup code including inline styles & layouts.
              </span>
              <button
                onClick={handleCopyCode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-bold tracking-wide transition-all border shrink-0 ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
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
            <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono">
              <pre className="text-[11px] leading-relaxed text-zinc-300 font-mono overflow-x-auto whitespace-pre select-text">
                <code>{codeContent}</code>
              </pre>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
