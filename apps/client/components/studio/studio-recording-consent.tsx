"use client";

import { Button } from "@ototabi/ui/components/button";
import { useEffect, useRef } from "react";

import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton, MonoLabel } from "@/components/ui/retro-primitives";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDecline}
      onCancel={onDecline}
      aria-labelledby="recording-consent-title"
      className="border-0 bg-transparent p-0 backdrop:bg-black/60 open:flex open:items-center open:justify-center"
    >
      <AnalogCard className="w-full max-w-md p-6">
        <div className="mb-4">
          <MonoLabel>Legal</MonoLabel>
          <h2
            id="recording-consent-title"
            className="font-display text-xl font-bold tracking-tight uppercase"
          >
            Recording consent
          </h2>
        </div>
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
    </dialog>
  );
}
