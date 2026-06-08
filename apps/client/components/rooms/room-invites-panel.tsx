"use client";

import { Input } from "@ototabi/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore, useState } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { formatDateTime } from "@/lib/date-utils";
import { Copy } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

function subscribeNoop() {
  return () => {};
}

function useClientNowMs() {
  return useSyncExternalStore(
    subscribeNoop,
    () => Date.now(),
    () => 0,
  );
}

type RoomInvitesPanelProps = {
  roomId: string;
  roomCode: string;
};

export function RoomInvitesPanel({ roomId, roomCode }: RoomInvitesPanelProps) {
  const trpc = useTRPC();
  const clientNowMs = useClientNowMs();
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const { data: invites, refetch: refetchInvites } = useQuery(
    trpc.studioAccess.listInvites.queryOptions({ roomId }, { enabled: !!roomId }),
  );

  const createInvite = useMutation(
    trpc.studioAccess.createInvite.mutationOptions({
      onSuccess: (invite) => {
        const link = `${window.location.origin}/rooms/${roomCode}/join?invite=${invite.token}`;
        setInviteLink(link);
        setInviteError("");
        void refetchInvites();
      },
      onError: (err) => setInviteError(err.message),
    }),
  );

  const revokeInvite = useMutation(
    trpc.studioAccess.revokeInvite.mutationOptions({
      onSuccess: () => void refetchInvites(),
    }),
  );

  const createDefaultInvite = () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    createInvite.mutate({ roomId, role: "participant", maxUses: 1, expiresAt });
  };

  const copyInviteLink = (inviteId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <MonoLabel className="mb-1 block">Guest access is token-gated</MonoLabel>
          <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
            Create a single-use participant invite. The raw token is shown once and stored only as a
            hash on the server.
          </p>
        </div>
        <MechButton
          type="button"
          onClick={createDefaultInvite}
          disabled={createInvite.isPending}
          className="h-10 shrink-0"
        >
          {createInvite.isPending ? "CREATING..." : "Create Secure Link"}
        </MechButton>
      </div>

      {inviteLink ? (
        <AnalogInset className="space-y-2 p-3">
          <MonoLabel className="text-accent block">New invite link</MonoLabel>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="border-border bg-popover text-foreground h-10 flex-1 rounded border font-mono text-[10px] shadow-inner"
            />
            <MechButton type="button" onClick={() => copyInviteLink("new", inviteLink)}>
              <Copy className="h-3 w-3" />
              {copiedInviteId === "new" ? "Copied" : "Copy"}
            </MechButton>
          </div>
        </AnalogInset>
      ) : null}

      {inviteError ? <MonoLabel className="text-led-on">{inviteError}</MonoLabel> : null}

      {invites && invites.length > 0 ? (
        <div className="space-y-1.5">
          {invites.map((invite) => {
            const revoked = !!invite.revokedAt;
            const expired =
              clientNowMs > 0 &&
              !!invite.expiresAt &&
              new Date(invite.expiresAt).getTime() <= clientNowMs;
            return (
              <div
                key={invite.id}
                className="border-border bg-popover flex flex-col gap-3 rounded border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <MonoLabel className="text-[9px]">
                    ROLE: {invite.role.toUpperCase()} {"//"} USES: {invite.usedCount}/
                    {invite.maxUses ?? "∞"}
                  </MonoLabel>
                  <MonoLabel className="mt-1 block text-[9px]">
                    {revoked
                      ? "REVOKED"
                      : expired
                        ? "EXPIRED"
                        : invite.expiresAt
                          ? `EXPIRES: ${formatDateTime(invite.expiresAt)}`
                          : "NO EXPIRY"}
                  </MonoLabel>
                </div>
                {!revoked ? (
                  <MechButton
                    type="button"
                    onClick={() => revokeInvite.mutate({ roomId, inviteId: invite.id })}
                    className="h-7 px-2 text-[9px]"
                  >
                    Revoke
                  </MechButton>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <MonoLabel className="text-muted-foreground/60">
          No secure invite links yet. Create one before sharing with guests.
        </MonoLabel>
      )}
    </div>
  );
}
