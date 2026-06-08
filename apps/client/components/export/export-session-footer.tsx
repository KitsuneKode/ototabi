"use client";

import { MechButton } from "@/components/ui/retro-primitives";
import { ArrowLeft } from "@/lib/icons";

type ExportSessionFooterProps = {
  sessionId: string;
  onDashboard: () => void;
  onSessionReview: () => void;
};

export function ExportSessionFooter({
  sessionId,
  onDashboard,
  onSessionReview,
}: ExportSessionFooterProps) {
  return (
    <div className="flex items-center gap-4 pb-8">
      <MechButton onClick={onDashboard} aria-label="Return to dashboard">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Dashboard
      </MechButton>
      <MechButton
        onClick={onSessionReview}
        aria-label={`Open session review for ${sessionId.slice(-8).toUpperCase()}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Session Review
      </MechButton>
    </div>
  );
}
