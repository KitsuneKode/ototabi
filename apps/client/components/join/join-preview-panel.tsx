"use client";

import type { RefObject } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatDateTime } from "@/lib/date-utils";
import { Mic, VideoOff } from "@/lib/icons";

type JoinPreviewPanelProps = {
  roomName: string;
  guestNeedsInvite: boolean;
  inviteInfo?: {
    role: string;
    expiresAt?: string | Date | null;
  } | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  audioLevel: number;
  stream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function JoinPreviewPanel({
  roomName,
  guestNeedsInvite,
  inviteInfo,
  videoEnabled,
  audioEnabled,
  audioLevel,
  stream,
  videoRef,
}: JoinPreviewPanelProps) {
  return (
    <div className="bg-popover border-border flex min-h-[320px] flex-col justify-between rounded border p-5 shadow-inner md:col-span-7 md:min-h-[440px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LedInline color="green" pulse />
            <MonoLabel>CH 1 : CALIBRATION</MonoLabel>
          </div>
          <MonoLabel className="bg-card/60 border-border rounded border px-2 py-0.5">
            Room: {roomName}
          </MonoLabel>
        </div>

        {guestNeedsInvite ? (
          <AnalogInset className="border-led-on/30 p-3">
            <MonoLabel className="text-led-on block">INVITE LINK REQUIRED</MonoLabel>
            <MonoLabel className="mt-1 block text-[9px] leading-relaxed">
              Ask the host to share their studio invite from Room Settings. Plain room codes are not
              enough for guest access.
            </MonoLabel>
          </AnalogInset>
        ) : null}

        {inviteInfo ? (
          <AnalogInset className="p-3">
            <MonoLabel className="text-accent block">SECURE INVITE VERIFIED</MonoLabel>
            <MonoLabel className="mt-1 block text-[9px]">
              ROLE: {inviteInfo.role.toUpperCase()}
              {inviteInfo.expiresAt
                ? ` // EXPIRES: ${formatDateTime(inviteInfo.expiresAt)}`
                : " // NO EXPIRY"}
            </MonoLabel>
          </AnalogInset>
        ) : null}

        <div className="scanlines relative flex aspect-video w-full items-center justify-center overflow-hidden rounded border-4 border-[#1a1a1a] bg-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          {videoEnabled && stream?.getVideoTracks().length ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Camera preview"
              className="relative z-10 h-full w-full scale-x-[-1] object-cover"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 p-6 text-center">
              <div className="bg-card/30 border-border text-muted-foreground/60 rounded-full border p-3">
                <VideoOff className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground/60 font-mono text-xs font-bold uppercase">
                CAMERA DIAL DISENGAGED
              </p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded border border-white/10 bg-black/80 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
            <LedInline color={videoEnabled ? "green" : "red"} size="sm" />
            FEED: {videoEnabled ? "ACTIVE" : "MUTED"}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <MonoLabel className="flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" /> MIC AUDIO LEVEL
          </MonoLabel>
          <MonoLabel className={audioLevel > 50 ? "text-accent" : ""}>{audioLevel}%</MonoLabel>
        </div>
        <AnalogInset className="flex h-3 items-stretch p-0.5">
          <div
            className="rounded-sm transition-[width] duration-75"
            style={{
              width: `${audioEnabled ? audioLevel : 0}%`,
              backgroundColor: "var(--color-led-on)",
              boxShadow: audioEnabled && audioLevel > 0 ? "0 0 5px var(--color-led-on)" : "none",
            }}
          />
        </AnalogInset>
        <MonoLabel className="text-[9px] leading-normal">
          Establish modulation peak verification before studio connection.
        </MonoLabel>
      </div>
    </div>
  );
}
