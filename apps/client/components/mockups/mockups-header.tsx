"use client";

import type { ReactNode } from "react";

import type { DesignPreset } from "@/lib/mockups/design-presets";

import { Sliders, Monitor, Tablet, Smartphone, ExternalLink, Code, RefreshCw } from "@/lib/icons";

export type MockupViewportSize = "desktop" | "tablet" | "mobile";

type MockupsHeaderProps = {
  activeDesign: DesignPreset;
  viewportSize: MockupViewportSize;
  isIframeLoading: boolean;
  showCode: boolean;
  onViewportChange: (size: MockupViewportSize) => void;
  onReload: () => void;
  onToggleCode: () => void;
};

export function MockupsHeader({
  activeDesign,
  viewportSize,
  isIframeLoading,
  showCode,
  onViewportChange,
  onReload,
  onToggleCode,
}: MockupsHeaderProps) {
  return (
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

      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <ViewportButton
            active={viewportSize === "desktop"}
            onClick={() => onViewportChange("desktop")}
            title="Desktop (100% Width)"
          >
            <Monitor className="h-4 w-4" />
          </ViewportButton>
          <ViewportButton
            active={viewportSize === "tablet"}
            onClick={() => onViewportChange("tablet")}
            title="Tablet (768px Width)"
          >
            <Tablet className="h-4 w-4" />
          </ViewportButton>
          <ViewportButton
            active={viewportSize === "mobile"}
            onClick={() => onViewportChange("mobile")}
            title="Mobile (375px Width)"
          >
            <Smartphone className="h-4 w-4" />
          </ViewportButton>
        </div>

        <button
          type="button"
          onClick={onReload}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
          title="Reload Design"
        >
          <RefreshCw className={`h-4 w-4 ${isIframeLoading ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onToggleCode}
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
  );
}

type ViewportButtonProps = {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
};

function ViewportButton({ active, onClick, title, children }: ViewportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded p-1.5 transition-all ${
        active ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
