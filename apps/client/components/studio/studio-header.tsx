"use client";

import type { StudioConnectionUiStatus } from "@ototabi/trpc/studio-health";

import { Button } from "@ototabi/ui/components/button";

import { AnalogInset } from "@/components/ui/analog-card";
import { Led, LedInline } from "@/components/ui/led";
import { MonoLabel, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatTimer } from "@/lib/date-utils";
import { ArrowLeft, PanelRight } from "@/lib/icons";

type StudioHeaderProps = {
  roomName: string;
  roomCode: string;
  operatorLabel: string;
  canControlStudio: boolean;
  isCreator: boolean;
  connectionHealth: StudioConnectionUiStatus;
  connectionError: string | null;
  isRecording: boolean;
  isPaused: boolean;
  recordingSeconds: number;
  onReturn: () => void;
  onToggleSidebar: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePause: () => void;
};

export function StudioHeader({
  roomName,
  roomCode,
  operatorLabel,
  canControlStudio,
  isCreator,
  connectionHealth,
  connectionError,
  isRecording,
  isPaused,
  recordingSeconds,
  onReturn,
  onToggleSidebar,
  onStartRecording,
  onStopRecording,
  onTogglePause,
}: StudioHeaderProps) {
  return (
    <header className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 px-3 py-3 shadow-[0_4px_0_0_var(--color-border)] sm:px-5">
      <div className="flex items-center gap-4">
        <MechButton
          onClick={onReturn}
          aria-label="Return to Dashboard"
          className="focus-visible:ring-accent h-9 w-9 focus-visible:ring-2 focus-visible:outline-none"
          title="Return to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </MechButton>
        <div>
          <h1 className="text-foreground text-sm leading-none font-bold tracking-wide uppercase">
            Studio: <span className="text-muted-foreground">{roomName}</span>
          </h1>
          <div className="mt-0.5 flex items-center gap-1.5">
            <MonoLabel>
              Join Code: <span className="text-foreground">{roomCode}</span>
              {" | "}Op: {operatorLabel}
            </MonoLabel>
            {canControlStudio ? (
              <StatusBadge variant="ok" className="text-[10px]">
                <LedInline color="green" size="sm" />
                {isCreator ? "HOST" : "CO-HOST"}
              </StatusBadge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MechButton
          onClick={onToggleSidebar}
          aria-label="Toggle participants panel"
          title="Participants"
          className="focus-visible:ring-accent h-9 w-9 focus-visible:ring-2 focus-visible:outline-none md:hidden"
        >
          <PanelRight className="h-4 w-4" />
        </MechButton>

        <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
          <Led
            color={
              connectionHealth === "connected"
                ? "green"
                : connectionHealth === "reconnecting"
                  ? "amber"
                  : "red"
            }
            size="sm"
            pulse={connectionHealth === "reconnecting"}
          />
          <MonoLabel>
            {connectionHealth === "connected"
              ? "LIVE"
              : connectionHealth === "reconnecting"
                ? "SYNC"
                : "LOST"}
          </MonoLabel>
        </AnalogInset>

        {connectionError ? (
          <div className="flex items-center gap-1.5 rounded border border-yellow-600/40 bg-yellow-400/10 px-3 py-1.5">
            <MonoLabel className="text-yellow-600 dark:text-yellow-400">
              {connectionError}
            </MonoLabel>
          </div>
        ) : null}

        {isRecording ? (
          <AnalogInset className="flex items-center gap-2 px-3 py-1.5">
            <Led color={isPaused ? "amber" : "red"} size="sm" pulse={!isPaused} />
            <MonoLabel className="text-led-on tabular-nums">
              {isPaused ? "PAUSED" : "REC"} · {formatTimer(recordingSeconds)}
            </MonoLabel>
          </AnalogInset>
        ) : null}

        {canControlStudio ? (
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <Button
                onClick={onStartRecording}
                className="btn-mechanical text-secondary-foreground h-9 rounded px-5 text-[10px] font-bold tracking-widest uppercase"
              >
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  onClick={onTogglePause}
                  className="btn-mechanical text-secondary-foreground h-9 rounded px-4 text-[10px] font-bold tracking-widest uppercase"
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  onClick={onStopRecording}
                  className="bg-led-on/90 hover:bg-led-on border-led-on/60 h-9 rounded border px-5 text-[10px] font-bold tracking-widest text-white uppercase shadow-[0_3px_5px_rgba(0,0,0,0.2),0_0_10px_var(--color-led-on)] transition-[transform,box-shadow] duration-150 ease-[var(--ease-mechanical)] active:translate-y-[2px]"
                >
                  Stop
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
