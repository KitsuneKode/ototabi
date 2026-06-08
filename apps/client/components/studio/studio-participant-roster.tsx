"use client";

import { useParticipants } from "@livekit/components-react";
import { useMutation } from "@tanstack/react-query";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MechButton, MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { formatParticipantLabel, isGuestEmail } from "@/lib/guest-display";
import { useTRPC } from "@/trpc/client";

type StudioParticipantRosterProps = {
  roomDbId: string;
  localUserName: string;
  localUserEmail?: string | null;
  localRole?: string;
  canControlStudio: boolean;
  onBroadcastMuteRequest: (targetUserId: string) => void;
};

export function StudioParticipantRoster({
  roomDbId,
  localUserEmail,
  localRole,
  canControlStudio,
  onBroadcastMuteRequest,
}: StudioParticipantRosterProps) {
  const trpc = useTRPC();
  const participants = useParticipants();

  const removeGuestMutation = useMutation(trpc.studioAccess.removeGuest.mutationOptions());
  const muteRequestMutation = useMutation(
    trpc.studioAccess.requestParticipantMute.mutationOptions(),
  );

  const roster = participants.map((p) => {
    const isLocal = p.isLocal;
    const identity = p.identity || p.name || "Participant";
    const guest =
      isLocal && localRole === "guest"
        ? true
        : isGuestEmail(identity) || identity.toLowerCase().includes("guest");
    return {
      sid: p.sid,
      userId: identity,
      label: formatParticipantLabel({
        name: p.name || identity,
        email: isLocal ? localUserEmail : identity,
        isLocalGuest: guest,
      }),
      isLocal,
    };
  });

  const handleMuteRequest = async (targetUserId: string) => {
    try {
      await muteRequestMutation.mutateAsync({ roomId: roomDbId, targetUserId });
      onBroadcastMuteRequest(targetUserId);
    } catch (err) {
      console.error("Mute request failed:", err);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    try {
      await removeGuestMutation.mutateAsync({ roomId: roomDbId, targetUserId });
    } catch (err) {
      console.error("Remove guest failed:", err);
    }
  };

  return (
    <div className="border-border border-b p-4">
      <PanelTitle label="Roster" title="Participants" className="mb-3" />
      {roster.length === 0 ? (
        <MonoLabel className="text-[9px]">No participants connected</MonoLabel>
      ) : (
        <ul className="space-y-2" aria-label="Studio participants">
          {roster.map((entry) => (
            <li key={entry.sid}>
              <AnalogInset className="flex flex-col gap-2 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] font-bold tracking-wide uppercase">
                    {entry.label}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {entry.isLocal ? <MonoLabel className="text-[10px]">YOU</MonoLabel> : null}
                    <LedInline color="green" size="sm" />
                  </div>
                </div>
                {canControlStudio && !entry.isLocal ? (
                  <div className="flex gap-1.5">
                    <MechButton
                      type="button"
                      className="h-7 flex-1 px-2 text-[9px]"
                      disabled={muteRequestMutation.isPending}
                      onClick={() => void handleMuteRequest(entry.userId)}
                    >
                      Mute req
                    </MechButton>
                    <MechButton
                      type="button"
                      variant="danger"
                      className="h-7 flex-1 px-2 text-[9px]"
                      disabled={removeGuestMutation.isPending}
                      onClick={() => void handleRemove(entry.userId)}
                    >
                      Remove
                    </MechButton>
                  </div>
                ) : null}
              </AnalogInset>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
