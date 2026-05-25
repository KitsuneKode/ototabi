"use client";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatDateTime } from "@/lib/date-utils";
import { RefreshCw } from "@/lib/icons";

export type SessionTimelineEvent = {
  id: string;
  type: string;
  occurredAt: Date | string;
  trackSid?: string | null;
  message?: string | null;
  user?: { name: string | null } | null;
};

function eventLedColor(type: string): "green" | "red" | "amber" {
  if (type === "START" || type === "UPLOAD_COMPLETED") return "green";
  if (type === "STOP" || type === "LEAVE") return "red";
  if (type === "SYNC_MARKER") return "amber";
  return "amber";
}

export function SessionTimeline({
  events,
  isLoading,
  emptyLabel = "No timeline events recorded yet",
}: {
  events: SessionTimelineEvent[] | undefined;
  isLoading?: boolean;
  emptyLabel?: string;
}) {
  return (
    <AnalogCard className="p-6">
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="text-accent h-4 w-4 animate-spin" />
          <MonoLabel>Loading event timeline...</MonoLabel>
        </div>
      ) : events?.length ? (
        <ol className="space-y-2" aria-label="Session event timeline">
          {events.map((event) => (
            <li key={event.id}>
              <AnalogInset className="p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <LedInline color={eventLedColor(event.type)} size="sm" />
                    <div>
                      <p className="font-mono text-xs font-bold tracking-wider uppercase">
                        {event.type.replaceAll("_", " ")}
                      </p>
                      <MonoLabel className="text-[9px]">
                        {event.user?.name ?? "System"}
                        {event.trackSid ? ` // ${event.trackSid.slice(-10)}` : ""}
                      </MonoLabel>
                    </div>
                  </div>
                  <MonoLabel className="text-[9px]">{formatDateTime(event.occurredAt)}</MonoLabel>
                </div>
                {event.message ? (
                  <p className="text-muted-foreground mt-2 font-mono text-[10px] leading-relaxed">
                    {event.message}
                  </p>
                ) : null}
              </AnalogInset>
            </li>
          ))}
        </ol>
      ) : (
        <AnalogInset className="flex flex-col items-center justify-center border-dashed py-10 text-center">
          <MonoLabel>{emptyLabel}</MonoLabel>
        </AnalogInset>
      )}
    </AnalogCard>
  );
}
