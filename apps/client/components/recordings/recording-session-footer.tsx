"use client";

import Link from "next/link";

import { AnalogCard } from "@/components/ui/analog-card";
import { Led } from "@/components/ui/led";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { ArrowLeft } from "@/lib/icons";

type RecordingSessionFooterProps = {
  roomCode: string;
  onDashboard: () => void;
};

export function RecordingSessionFooter({ roomCode, onDashboard }: RecordingSessionFooterProps) {
  return (
    <>
      <AnalogCard className="flex items-start gap-3 p-5">
        <Led color="green" size="sm" className="mt-0.5 shrink-0" />
        <div>
          <MonoLabel className="mb-1 block">System Note</MonoLabel>
          <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
            Tracks are uploaded directly from participants&apos; browser IndexedDB storage. If a
            participant closed their tab before upload completed, they must reopen the recording
            recovery console to resume. Download links are valid after full upload completion.
          </p>
        </div>
      </AnalogCard>

      <div className="flex items-center gap-4 pb-8">
        <MechButton onClick={onDashboard}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </MechButton>
        <Link
          href={`/rooms/${roomCode}/settings`}
          className="text-muted-foreground hover:text-accent font-mono text-xs font-bold tracking-widest uppercase transition-colors"
        >
          Room Settings →
        </Link>
      </div>
    </>
  );
}
