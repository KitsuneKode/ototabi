"use client";

import { LedInline } from "@/components/ui/led";
import { StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { ArrowLeft } from "@/lib/icons";

type RecordingSessionHeaderActionsProps = {
  onBack: () => void;
  allUploaded: boolean;
};

export function RecordingSessionHeaderActions({
  onBack,
  allUploaded,
}: RecordingSessionHeaderActionsProps) {
  return (
    <>
      <MechButton onClick={onBack} className="h-9 px-2.5 py-2">
        <ArrowLeft className="h-4 w-4" />
      </MechButton>
      <StatusBadge variant={allUploaded ? "ok" : "warn"}>
        <LedInline color={allUploaded ? "green" : "amber"} size="sm" pulse={!allUploaded} />
        {allUploaded ? "ALL UPLOADED" : "SYNC PENDING"}
      </StatusBadge>
    </>
  );
}
