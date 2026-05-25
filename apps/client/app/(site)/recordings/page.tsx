"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, StatusBadge, MechButton } from "@/components/ui/retro-primitives";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useAuthGate } from "@/lib/hooks/use-session";
import { ExternalLink, Film, Lock } from "@/lib/icons";
import { useTRPC } from "@/trpc/client";

export default function RecordingsIndexPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { showGate, sessionReady } = useAuthGate();

  const summary = useQuery({
    ...trpc.dashboard.getSummary.queryOptions(),
    enabled: sessionReady,
  });

  if (showGate) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center px-4">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <Lock className="text-led-on mx-auto mb-4 h-10 w-10" />
          <MechButton onClick={() => router.push("/auth/signin")} className="w-full">
            Sign In
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const sessions = summary.data?.recentSessions ?? [];

  return (
    <AppShell maxWidth="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          label="Global reel index"
          title="Recordings"
          description="Recent sessions across your studios — open review, export, or clips."
        />

        {summary.isLoading ? (
          <AnalogCard className="p-12 text-center font-mono text-xs tracking-widest uppercase">
            Loading sessions...
          </AnalogCard>
        ) : sessions.length === 0 ? (
          <AnalogInset className="flex flex-col items-center gap-4 border-dashed p-16 text-center">
            <Film className="text-muted-foreground/30 h-12 w-12" />
            <MonoLabel>No recordings yet</MonoLabel>
            <p className="text-muted-foreground max-w-sm font-mono text-[10px] leading-relaxed">
              Complete a studio session to see it here.
            </p>
            <MechButton onClick={() => router.push("/dashboard")}>Open dashboard</MechButton>
          </AnalogInset>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <AnalogCard key={session.id} className="p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <PanelTitle
                      label={session.room?.name ?? "Studio"}
                      title={`Session ${session.id.slice(-6).toUpperCase()}`}
                    />
                    <MonoLabel className="mt-2 block">
                      {formatDate(session.startedAt)} {formatTime(session.startedAt)} &bull;{" "}
                      {session.tracks.length} tracks
                    </MonoLabel>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {session.hasTranscript ? (
                        <StatusBadge variant="ok" className="text-[8px]">
                          Transcript
                        </StatusBadge>
                      ) : null}
                      {session.hasChapters ? (
                        <StatusBadge variant="ok" className="text-[8px]">
                          Chapters
                        </StatusBadge>
                      ) : null}
                      {session.hasShowNotes ? (
                        <StatusBadge variant="ok" className="text-[8px]">
                          Notes
                        </StatusBadge>
                      ) : null}
                      {session.clipsReady ? (
                        <StatusBadge variant="ok" className="text-[8px]">
                          Clips
                        </StatusBadge>
                      ) : null}
                      {session.aiStatus === "processing" ? (
                        <StatusBadge variant="warn" className="text-[8px]">
                          AI processing
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/recordings/${session.id}`}
                      className="btn-mechanical text-secondary-foreground inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold tracking-wider uppercase"
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
              </AnalogCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
