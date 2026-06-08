"use client";

import type { StudioConnectionUiStatus } from "@ototabi/trpc/studio-health";

import type { StudioSidebarTab, StudioUploadProgressEntry } from "@/lib/hooks/use-studio-page";

import { StudioChatPanel } from "@/components/studio/studio-chat-panel";
import { StudioHealthPanel } from "@/components/studio/studio-health-panel";
import { StudioParticipantRoster } from "@/components/studio/studio-participant-roster";
import { StudioUploadsPanel } from "@/components/studio/studio-uploads-panel";

type StudioSidebarProps = {
  open: boolean;
  tab: StudioSidebarTab;
  onTabChange: (tab: StudioSidebarTab) => void;
  onClose: () => void;
  roomDbId: string;
  sessionUser: { id: string; name?: string | null; email?: string | null };
  sessionRole?: string;
  canControlStudio: boolean;
  isRecording: boolean;
  connectionHealth: StudioConnectionUiStatus;
  progressMap: Map<string, StudioUploadProgressEntry>;
  micDeviceId: string;
  camDeviceId: string;
  onBroadcastMuteRequest: (targetUserId: string) => void;
};

const TAB_CLASS = (active: boolean) =>
  `flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
    active
      ? "bg-popover text-foreground border-accent border-b-2"
      : "bg-card text-muted-foreground hover:text-foreground"
  }`;

export function StudioSidebar({
  open,
  tab,
  onTabChange,
  onClose,
  roomDbId,
  sessionUser,
  sessionRole,
  canControlStudio,
  isRecording,
  connectionHealth,
  progressMap,
  micDeviceId,
  camDeviceId,
  onBroadcastMuteRequest,
}: StudioSidebarProps) {
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} aria-hidden />
      ) : null}

      <aside
        className={`border-border bg-card flex-col overflow-y-auto border-l-2 shadow-[-4px_0_0_0_var(--color-border)] ${
          open ? "fixed inset-y-0 right-0 z-30 flex w-72" : "hidden"
        } md:relative md:z-auto md:flex md:w-72`}
      >
        <div className="border-border flex shrink-0 border-b">
          <button
            type="button"
            onClick={() => onTabChange("health")}
            className={TAB_CLASS(tab === "health")}
          >
            Health
          </button>
          <button
            type="button"
            onClick={() => onTabChange("uploads")}
            className={TAB_CLASS(tab === "uploads")}
          >
            Uploads
          </button>
          <button
            type="button"
            onClick={() => onTabChange("chat")}
            className={TAB_CLASS(tab === "chat")}
          >
            Chat
          </button>
        </div>

        <StudioParticipantRoster
          roomDbId={roomDbId}
          localUserName={sessionUser.name ?? ""}
          localUserEmail={sessionUser.email}
          localRole={sessionRole}
          canControlStudio={canControlStudio}
          onBroadcastMuteRequest={onBroadcastMuteRequest}
        />

        {tab === "health" ? (
          <StudioHealthPanel
            roomDbId={roomDbId}
            localUserId={sessionUser.id}
            localUserEmail={sessionUser.email}
            localRole={sessionRole}
            isRecording={isRecording}
            localConnectionHealth={connectionHealth}
            uploadProgress={Array.from(progressMap.entries()).map(([, data]) => ({
              name: data.name,
              progress: data.progress,
              uploadedParts: data.uploadedParts,
              totalParts: data.totalParts,
            }))}
            micDeviceId={micDeviceId}
            camDeviceId={camDeviceId}
          />
        ) : tab === "uploads" ? (
          <StudioUploadsPanel
            canControlStudio={canControlStudio}
            progressMap={progressMap}
            localUserName={sessionUser.name ?? undefined}
          />
        ) : (
          <StudioChatPanel
            roomDbId={roomDbId}
            sessionUserName={sessionUser.name || sessionUser.email || ""}
          />
        )}
      </aside>
    </>
  );
}
