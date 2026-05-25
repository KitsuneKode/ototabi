"use client";

import { Button } from "@ototabi/ui/components/button";

import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";

type StudioRecordingConsentProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
};

export function StudioRecordingConsent({
  open,
  onAccept,
  onDecline,
  loading = false,
}: StudioRecordingConsentProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recording-consent-title"
    >
      <AnalogCard className="w-full max-w-md p-6">
        <PanelTitle label="Legal" title="Recording consent" className="mb-4" />
        <p className="text-muted-foreground mb-6 font-mono text-xs leading-relaxed">
          This studio captures your microphone, camera, and screen feeds locally for upload to the
          host&apos;s session. By continuing, you consent to being recorded for this room.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <MechButton
            type="button"
            onClick={onDecline}
            disabled={loading}
            className="h-10 justify-center px-4 text-xs"
          >
            Decline
          </MechButton>
          <Button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="btn-mechanical text-secondary-foreground h-10 rounded px-5 text-[10px] font-bold tracking-widest uppercase"
          >
            {loading ? "Saving…" : "I consent — continue"}
          </Button>
        </div>
        <MonoLabel className="text-muted-foreground/60 mt-4 block text-[9px] leading-relaxed">
          Consent is stored per participant for this room and required before local capture starts.
        </MonoLabel>
      </AnalogCard>
    </div>
  );
}
