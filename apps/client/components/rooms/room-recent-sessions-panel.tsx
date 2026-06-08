"use client";

import Link from "next/link";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { formatDate, formatTime } from "@/lib/date-utils";
import { Film, ExternalLink, Calendar, Clock } from "@/lib/icons";

type RecordingSessionSummary = {
  id: string;
  status: string;
  startedAt: Date | string;
};

type RoomRecentSessionsPanelProps = {
  sessions: RecordingSessionSummary[] | undefined;
  isLoading: boolean;
};

export function RoomRecentSessionsPanel({ sessions, isLoading }: RoomRecentSessionsPanelProps) {
  return (
    <AnalogCard className="p-6">
      <PanelTitle label="Reel Index" title="Recent Sessions" className="mb-4" />

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse py-8 text-center font-mono text-xs tracking-widest uppercase">
          Loading session logs...
        </div>
      ) : !sessions?.length ? (
        <AnalogInset className="flex flex-col items-center justify-center border-dashed py-12 text-center">
          <Film className="text-muted-foreground/30 mb-3 h-8 w-8" />
          <MonoLabel>No sessions recorded yet</MonoLabel>
        </AnalogInset>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <AnalogInset
              key={session.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <StatusBadge variant={session.status === "RECORDING" ? "recording" : "default"}>
                  <LedInline
                    color={session.status === "RECORDING" ? "red" : "red-off"}
                    size="sm"
                    pulse={session.status === "RECORDING"}
                  />
                  {session.status}
                </StatusBadge>
                <div>
                  <MonoLabel className="text-foreground text-[9px] font-bold">
                    {session.id.slice(-8).toUpperCase()}
                  </MonoLabel>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Calendar className="text-muted-foreground/60 h-3 w-3" />
                    <MonoLabel className="text-[9px]">{formatDate(session.startedAt)}</MonoLabel>
                    <Clock className="text-muted-foreground/60 h-3 w-3" />
                    <MonoLabel className="text-[9px]">{formatTime(session.startedAt)}</MonoLabel>
                  </div>
                </div>
              </div>
              <Link
                href={`/recordings/${session.id}`}
                className="btn-mechanical text-secondary-foreground inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
              >
                View Tracks <ExternalLink className="h-3 w-3" />
              </Link>
            </AnalogInset>
          ))}
        </div>
      )}
    </AnalogCard>
  );
}
