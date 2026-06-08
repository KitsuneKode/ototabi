"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { ShieldAlert } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

type RoomStudioAccessPanelProps = {
  roomId: string;
  isLocked: boolean;
  onLockChanged: () => void;
};

export function RoomStudioAccessPanel({
  roomId,
  isLocked,
  onLockChanged,
}: RoomStudioAccessPanelProps) {
  const trpc = useTRPC();

  const {
    data: pendingRequests,
    isLoading: pendingIsLoading,
    refetch: refetchPending,
  } = useQuery(
    trpc.studioAccess.listJoinRequests.queryOptions(
      { roomId, status: "pending" },
      { enabled: !!roomId, refetchInterval: 5000 },
    ),
  );

  const lockMutation = useMutation(trpc.studioAccess.lockRoom.mutationOptions());
  const unlockMutation = useMutation(trpc.studioAccess.unlockRoom.mutationOptions());
  const admitMutation = useMutation(
    trpc.studioAccess.admitJoinRequest.mutationOptions({
      onSuccess: () => void refetchPending(),
    }),
  );
  const denyMutation = useMutation(
    trpc.studioAccess.denyJoinRequest.mutationOptions({
      onSuccess: () => void refetchPending(),
    }),
  );

  const toggleLock = useCallback(() => {
    if (isLocked) {
      unlockMutation.mutate({ roomId }, { onSuccess: onLockChanged });
    } else {
      lockMutation.mutate({ roomId }, { onSuccess: onLockChanged });
    }
  }, [isLocked, lockMutation, unlockMutation, roomId, onLockChanged]);

  return (
    <AnalogCard className="space-y-4 p-6">
      <PanelTitle label="Studio Gate" title="Lock & Admit" className="mb-4" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground font-mono text-xs leading-relaxed">
          When locked, guests with an invite must be admitted before they can join or receive a
          LiveKit token.
        </p>
        <MechButton
          onClick={toggleLock}
          disabled={lockMutation.isPending || unlockMutation.isPending}
          className="h-10 shrink-0 justify-center px-4 text-xs"
        >
          <ShieldAlert className="h-4 w-4" />
          {isLocked ? "UNLOCK ROOM" : "LOCK ROOM"}
        </MechButton>
      </div>

      {isLocked ? (
        <div className="space-y-2">
          <MonoLabel className="text-[9px]">Pending join requests</MonoLabel>
          {pendingIsLoading ? (
            <MonoLabel className="text-muted-foreground animate-pulse text-[9px]">
              Loading...
            </MonoLabel>
          ) : !pendingRequests?.length ? (
            <AnalogInset className="border-dashed py-6 text-center">
              <MonoLabel className="text-muted-foreground">No guests waiting</MonoLabel>
            </AnalogInset>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <AnalogInset
                  key={req.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <MonoLabel className="text-foreground text-[10px] font-bold">
                    {req.user.name}
                  </MonoLabel>
                  <div className="flex gap-2">
                    <MechButton
                      className="h-8 px-3 text-[10px]"
                      onClick={() => admitMutation.mutate({ roomId, targetUserId: req.userId })}
                      disabled={admitMutation.isPending}
                    >
                      Admit
                    </MechButton>
                    <MechButton
                      variant="danger"
                      className="h-8 px-3 text-[10px]"
                      onClick={() => denyMutation.mutate({ roomId, targetUserId: req.userId })}
                      disabled={denyMutation.isPending}
                    >
                      Deny
                    </MechButton>
                  </div>
                </AnalogInset>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AnalogCard>
  );
}
