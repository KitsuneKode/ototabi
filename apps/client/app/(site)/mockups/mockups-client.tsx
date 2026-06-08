"use client";

import { useState } from "react";

import { MockupsExploratoryBanner } from "@/components/marketing/mockups-exploratory-banner";
import { MockupsGallery } from "@/components/mockups/mockups-gallery";
import { MockupsHeader, type MockupViewportSize } from "@/components/mockups/mockups-header";
import { MockupsPreview } from "@/components/mockups/mockups-preview";
import { DESIGN_PRESETS } from "@/lib/mockups/design-presets";

export default function MockupsClientPage() {
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [viewportSize, setViewportSize] = useState<MockupViewportSize>("desktop");
  const [showCode, setShowCode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const activeDesign = DESIGN_PRESETS.find((d) => d.id === selectedDesign) ?? DESIGN_PRESETS[0]!;

  const handleSelectDesign = (id: number) => {
    setSelectedDesign(id);
    setIsIframeLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleReload = () => {
    setIsIframeLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-none">
      <div className="relative z-50 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <MockupsExploratoryBanner />
      </div>

      <MockupsHeader
        activeDesign={activeDesign}
        viewportSize={viewportSize}
        isIframeLoading={isIframeLoading}
        showCode={showCode}
        onViewportChange={setViewportSize}
        onReload={handleReload}
        onToggleCode={() => setShowCode((v) => !v)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <MockupsGallery
          designs={DESIGN_PRESETS}
          selectedDesignId={selectedDesign}
          activeDesign={activeDesign}
          onSelectDesign={handleSelectDesign}
        />
        <MockupsPreview
          key={`${activeDesign.id}-${reloadKey}`}
          activeDesign={activeDesign}
          viewportSize={viewportSize}
          showCode={showCode}
          onCloseCode={() => setShowCode(false)}
          onLoadingChange={setIsIframeLoading}
        />
      </div>
    </div>
  );
}
