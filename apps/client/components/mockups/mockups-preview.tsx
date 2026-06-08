"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import type { MockupViewportSize } from "@/components/mockups/mockups-header";
import type { DesignPreset } from "@/lib/mockups/design-presets";

import { Check, Copy, FileText, X } from "@/lib/icons";

type MockupsPreviewProps = {
  activeDesign: DesignPreset;
  viewportSize: MockupViewportSize;
  showCode: boolean;
  onCloseCode: () => void;
  onLoadingChange?: (loading: boolean) => void;
};

export function MockupsPreview({
  activeDesign,
  viewportSize,
  showCode,
  onCloseCode,
  onLoadingChange,
}: MockupsPreviewProps) {
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const {
    data: codeContent,
    isPending: codeIsLoading,
    isError: codeIsError,
    error: codeError,
  } = useQuery({
    queryKey: ["mockup-code", activeDesign.file],
    queryFn: async () => {
      const res = await fetch(`/mockups/${activeDesign.file}`);
      if (!res.ok) throw new Error("Failed to load code");
      return res.text();
    },
    enabled: showCode,
    staleTime: 60_000,
  });

  const codeInspectorText = codeIsLoading
    ? "Loading code content..."
    : codeIsError
      ? `Error loading code file: ${codeError.message}`
      : (codeContent ?? "");

  const handleCopyCode = () => {
    if (codeInspectorText.length > 0 && !codeIsLoading && !codeIsError) {
      navigator.clipboard.writeText(codeInspectorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const setLoading = (loading: boolean) => {
    setIsIframeLoading(loading);
    onLoadingChange?.(loading);
  };

  return (
    <>
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-900/20 p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#FFF 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div
          className={`relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all duration-300 ${
            viewportSize === "desktop"
              ? "h-full w-full"
              : viewportSize === "tablet"
                ? "h-[90%] w-[768px] border-4 border-zinc-800"
                : "h-[90%] w-[375px] border-4 border-zinc-800"
          }`}
        >
          <div className="flex w-full shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800" />
              <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800" />
              <div className="h-3 w-3 rounded-full border border-zinc-700 bg-zinc-800" />
            </div>
            <div className="w-72 truncate rounded-md border border-zinc-800/80 bg-zinc-950 px-4 py-0.5 text-center font-mono text-[10px] text-zinc-500">
              http://localhost:3000/mockups/{activeDesign.file}
            </div>
            <div className="animate-pulse rounded border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-emerald-500/80 uppercase">
              LIVE STAGE
            </div>
          </div>

          <div className="relative h-full w-full flex-1 bg-zinc-950">
            {isIframeLoading ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400" />
                <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  Loading preset assets...
                </span>
              </div>
            ) : null}

            <iframe
              ref={iframeRef}
              key={activeDesign.id}
              src={`/mockups/${activeDesign.file}`}
              title={`${activeDesign.name} design mockup preview`}
              onLoad={() => setLoading(false)}
              className="relative z-10 h-full w-full border-0"
              sandbox=""
              loading="lazy"
            />
          </div>
        </div>
      </main>

      {showCode ? (
        <MockupsCodeInspector
          activeDesign={activeDesign}
          codeInspectorText={codeInspectorText}
          codeIsLoading={codeIsLoading}
          codeIsError={codeIsError}
          copied={copied}
          onClose={onCloseCode}
          onCopy={handleCopyCode}
        />
      ) : null}
    </>
  );
}

type MockupsCodeInspectorProps = {
  activeDesign: DesignPreset;
  codeInspectorText: string;
  codeIsLoading: boolean;
  codeIsError: boolean;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
};

function MockupsCodeInspector({
  activeDesign,
  codeInspectorText,
  codeIsLoading,
  codeIsError,
  copied,
  onClose,
  onCopy,
}: MockupsCodeInspectorProps) {
  return (
    <aside className="animate-in slide-in-from-right relative z-30 flex w-[500px] shrink-0 flex-col overflow-hidden border-l border-zinc-900 bg-zinc-950 shadow-2xl duration-250">
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
          type="button"
          onClick={onClose}
          className="rounded border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-zinc-900/60 bg-zinc-900/20 p-3">
        <span className="font-mono text-[10px] text-zinc-400">
          Full standalone HTML mockup code including inline styles & layouts.
        </span>
        <button
          type="button"
          onClick={onCopy}
          disabled={codeIsLoading || codeIsError}
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

      <div className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono">
        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre text-zinc-300 select-text">
          <code>{codeInspectorText}</code>
        </pre>
      </div>
    </aside>
  );
}
