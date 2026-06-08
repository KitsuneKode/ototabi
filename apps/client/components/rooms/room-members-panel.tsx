"use client";

import { Input } from "@ototabi/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { useTRPC } from "@/trpc/client";

type RoomMembersPanelProps = {
  roomId: string;
};

export function RoomMembersPanel({ roomId }: RoomMembersPanelProps) {
  const trpc = useTRPC();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const { data: members, refetch: refetchMembers } = useQuery(
    trpc.rooms.getRoomMembers.queryOptions({ roomId }, { enabled: !!roomId }),
  );

  const inviteMutation = useMutation(
    trpc.rooms.inviteMember.mutationOptions({
      onSuccess: () => {
        setInviteEmail("");
        setInviteError("");
        void refetchMembers();
      },
      onError: (err) => setInviteError(err.message),
    }),
  );

  const removeMutation = useMutation(
    trpc.rooms.removeMember.mutationOptions({
      onSuccess: () => void refetchMembers(),
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Invite by email..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          aria-label="Invite member by email"
          className="border-border bg-popover text-foreground h-10 flex-1 rounded border font-mono text-xs shadow-inner"
          onKeyDown={(e) => {
            if (e.key === "Enter" && inviteEmail.trim()) {
              inviteMutation.mutate({ roomId, email: inviteEmail.trim() });
            }
          }}
        />
        <MechButton
          type="button"
          disabled={inviteMutation.isPending || !inviteEmail.trim()}
          className="h-10 shrink-0"
          onClick={() => inviteMutation.mutate({ roomId, email: inviteEmail.trim() })}
        >
          {inviteMutation.isPending ? "..." : "Invite"}
        </MechButton>
      </div>
      {inviteError ? <MonoLabel className="text-led-on">{inviteError}</MonoLabel> : null}

      {members && members.length > 0 ? (
        <div className="space-y-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="border-border bg-popover flex items-center justify-between rounded border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{m.user.name}</span>
                <MonoLabel className="text-[9px]">{m.role.toUpperCase()}</MonoLabel>
              </div>
              {m.role !== "host" ? (
                <MechButton
                  onClick={() => removeMutation.mutate({ roomId, targetUserId: m.userId })}
                  className="h-7 px-2 text-[9px]"
                >
                  Remove
                </MechButton>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <MonoLabel className="text-muted-foreground/60">
          No members yet. Invite collaborators above.
        </MonoLabel>
      )}
    </div>
  );
}
