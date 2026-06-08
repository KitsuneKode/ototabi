"use client";

import type { SessionReviewSession } from "@/lib/trpc/router-types";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatDateTime } from "@/lib/date-utils";

type ExportSessionMetaCardProps = {
  session: SessionReviewSession;
};

export function ExportSessionMetaCard({ session }: ExportSessionMetaCardProps) {
  const fields = [
    { label: "Session ID", value: session.id.slice(-8).toUpperCase(), accent: true },
    { label: "Room Code", value: session.room.code, accent: false },
    { label: "Started At", value: formatDateTime(session.startedAt), accent: false },
    { label: "Total Tracks", value: String(session.tracks.length), accent: true },
  ];

  return (
    <AnalogCard className="p-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {fields.map(({ label, value, accent }) => (
          <AnalogInset key={label} className="flex flex-col gap-1.5 p-4">
            <MonoLabel>{label}</MonoLabel>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}
            >
              {value}
            </span>
          </AnalogInset>
        ))}
      </div>
    </AnalogCard>
  );
}
