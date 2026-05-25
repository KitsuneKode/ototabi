"use client";

import Link from "next/link";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";
import {
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Settings as SettingsIcon,
  Sliders,
} from "@/lib/icons";

export type DashboardSession = {
  id: string;
  status: string;
  startedAt: Date;
  endedAt?: Date | null;
  tracks?: Array<{ id: string; status: string; type: string }>;
  room?: { id: string; name: string; code: string } | null;
  aiStatus?: "pending" | "processing" | "ready";
  hasTranscript?: boolean;
  hasChapters?: boolean;
  hasShowNotes?: boolean;
  clipsReady?: boolean;
};

function SessionAiBadges({ session }: { session: DashboardSession }) {
  const badges: Array<{ label: string; show: boolean }> = [
    { label: "Transcript", show: !!session.hasTranscript },
    { label: "Chapters", show: !!session.hasChapters },
    { label: "Notes", show: !!session.hasShowNotes },
    { label: "Clips", show: !!session.clipsReady },
  ];
  const visible = badges.filter((b) => b.show);
  if (visible.length === 0 && session.aiStatus === "processing") {
    return (
      <StatusBadge variant="warn" className="text-[10px]">
        AI PROCESSING
      </StatusBadge>
    );
  }
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((b) => (
        <StatusBadge key={b.label} variant="ok" className="text-[10px]">
          {b.label}
        </StatusBadge>
      ))}
    </div>
  );
}

export function DashboardSessionsPanel({
  selectedRoom,
  roomSessions,
  recentSessions,
  isLoadingRoomSessions,
  isLoadingRecent,
  onOpenSettings,
}: {
  selectedRoom: { id: string; name: string; code: string } | null;
  roomSessions: DashboardSession[];
  recentSessions: DashboardSession[];
  isLoadingRoomSessions: boolean;
  isLoadingRecent: boolean;
  onOpenSettings: () => void;
}) {
  if (selectedRoom) {
    return (
      <AnalogCard className="flex min-h-[480px] flex-col p-4 md:p-6">
        <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
          <PanelTitle label="CH 1 : Room History" title={selectedRoom.name} />
          <MechButton onClick={onOpenSettings}>
            <SettingsIcon className="h-3.5 w-3.5" />
            Room Settings
          </MechButton>
        </div>

        {isLoadingRoomSessions ? (
          <div className="text-muted-foreground animate-pulse py-12 text-center font-mono text-xs tracking-widest uppercase">
            LOADING SESSION LOGS...
          </div>
        ) : roomSessions.length === 0 ? (
          <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed px-6 py-16 text-center">
            <Film className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
            <MonoLabel className="mb-1 block">No Session Logs Captured</MonoLabel>
            <p className="text-muted-foreground/60 mx-auto max-w-sm font-mono text-[10px] leading-normal">
              Open the studio, record, and complete a session to compile tracks here.
            </p>
          </AnalogInset>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            <AnalogInset className="relative overflow-hidden p-4">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <MonoLabel className="text-[9px]">LATEST</MonoLabel>
                <LedInline color="green" size="sm" />
              </div>
              <MonoLabel className="mb-1 block">Quick Access Sheet</MonoLabel>
              <h3 className="mt-1 flex flex-wrap items-center gap-2 text-base font-bold tracking-tight uppercase">
                Session {roomSessions[0]!.id.slice(-6).toUpperCase()}
                <SessionAiBadges session={roomSessions[0]!} />
                <Link
                  href={`/recordings/${roomSessions[0]!.id}`}
                  className="text-accent bg-card border-border inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs underline-offset-2 shadow-sm hover:underline"
                >
                  Open Details <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href={`/export/${roomSessions[0]!.id}`}
                  className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase underline-offset-2 hover:underline"
                >
                  Export
                </Link>
              </h3>
              <MonoLabel className="mt-2 block">
                Recorded:{" "}
                {roomSessions[0]!.startedAt ? formatDateTime(roomSessions[0]!.startedAt) : ""}{" "}
                &bull; Tracks: {roomSessions[0]!.tracks?.length ?? 0}
              </MonoLabel>
            </AnalogInset>

            <div className="space-y-4">
              <MonoLabel className="border-border/40 block border-b pb-1">
                Reel Index Logs
              </MonoLabel>
              {roomSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        <RecoveryNote />
      </AnalogCard>
    );
  }

  if (isLoadingRecent) {
    return (
      <div className="bg-card border-border flex h-[480px] animate-pulse items-center justify-center rounded-lg border">
        <span className="text-muted-foreground animate-pulse font-mono text-xs tracking-widest uppercase">
          Loading Recent Sessions...
        </span>
      </div>
    );
  }

  if (recentSessions.length === 0) {
    return (
      <div className="border-border/60 bg-card/30 flex min-h-[480px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
        <Sliders className="text-muted-foreground/20 h-12 w-12 animate-pulse" />
        <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
          No Recent Sessions
        </h3>
        <p className="text-muted-foreground/60 mt-2 max-w-xs font-mono text-xs leading-relaxed">
          Select a room or create one to start recording.
        </p>
      </div>
    );
  }

  return (
    <AnalogCard className="flex min-h-[480px] flex-col p-6">
      <PanelTitle label="Cross-Room Query" title="Recent Sessions" />
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {recentSessions.map((session) => (
          <SessionRow key={session.id} session={session} showRoom />
        ))}
      </div>
    </AnalogCard>
  );
}

function SessionRow({ session, showRoom }: { session: DashboardSession; showRoom?: boolean }) {
  const allUploaded =
    (session.tracks?.length ?? 0) > 0 && session.tracks!.every((t) => t.status === "COMPLETED");

  return (
    <div className="border-border bg-card hover:border-accent/30 rounded border p-4 shadow-sm transition-colors">
      <div className="border-border/40 mb-3 flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <MonoLabel className="bg-popover border-border rounded border px-2 py-0.5">
            REEL: {session.id.slice(-6).toUpperCase()}
          </MonoLabel>
          {showRoom && session.room ? (
            <MonoLabel className="text-muted-foreground">{session.room.name}</MonoLabel>
          ) : null}
          <StatusBadge variant={session.status === "RECORDING" ? "recording" : "default"}>
            <LedInline
              color={session.status === "RECORDING" ? "red" : "red-off"}
              size="sm"
              pulse={session.status === "RECORDING"}
            />
            {session.status}
          </StatusBadge>
          <SessionAiBadges session={session} />
        </div>
        <div className="text-muted-foreground flex items-center gap-4 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <Calendar className="text-muted-foreground/60 h-3.5 w-3.5" />
            {formatDate(session.startedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="text-muted-foreground/60 h-3.5 w-3.5" />
            {formatTime(session.startedAt)}
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <MonoLabel>
          Tracks: {session.tracks?.length ?? 0} | {allUploaded ? "ALL UPLOADED" : "SYNC PENDING"}
        </MonoLabel>
        <div className="flex gap-2">
          <Link
            href={`/recordings/${session.id}`}
            className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold tracking-wider uppercase transition-transform active:scale-95"
          >
            Review <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/export/${session.id}`}
            className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase underline-offset-2 hover:underline"
          >
            Export
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecoveryNote() {
  return (
    <div className="border-border mt-6 flex items-start gap-2.5 border-t pt-4">
      <LedInline color="green" size="sm" className="mt-0.5 shrink-0" />
      <MonoLabel className="leading-relaxed">
        SYSTEM NOTE: Pending uploads can be resumed from the{" "}
        <Link href="/recovery" className="text-accent underline-offset-2 hover:underline">
          Recovery Console
        </Link>
        .
      </MonoLabel>
    </div>
  );
}
