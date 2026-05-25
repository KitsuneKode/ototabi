"use client";

import { useParticipants } from "@livekit/components-react";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatParticipantLabel, isGuestEmail } from "@/lib/guest-display";

type StudioParticipantRosterProps = {
  localUserName: string;
  localUserEmail?: string | null;
  localRole?: string;
};

export function StudioParticipantRoster({
  localUserEmail,
  localRole,
}: StudioParticipantRosterProps) {
  const participants = useParticipants();

  const roster = participants.map((p) => {
    const isLocal = p.isLocal;
    const identity = p.identity || p.name || "Participant";
    const guest =
      isLocal && localRole === "guest"
        ? true
        : isGuestEmail(identity) || identity.toLowerCase().includes("guest");
    return {
      sid: p.sid,
      label: formatParticipantLabel({
        name: p.name || identity,
        email: isLocal ? localUserEmail : identity,
        isLocalGuest: guest,
      }),
      isLocal,
    };
  });

  return (
    <div className="border-border border-b p-4">
      <PanelTitle label="Roster" title="Participants" className="mb-3" />
      {roster.length === 0 ? (
        <MonoLabel className="text-[9px]">No participants connected</MonoLabel>
      ) : (
        <ul className="space-y-2" aria-label="Studio participants">
          {roster.map((entry) => (
            <li key={entry.sid}>
              <AnalogInset className="flex items-center justify-between gap-2 p-2">
                <span className="truncate font-mono text-[10px] font-bold tracking-wide uppercase">
                  {entry.label}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {entry.isLocal ? <MonoLabel className="text-[10px]">YOU</MonoLabel> : null}
                  <LedInline color="green" size="sm" />
                </div>
              </AnalogInset>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
