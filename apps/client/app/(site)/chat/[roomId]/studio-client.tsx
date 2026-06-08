"use client";

import { RoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import { SessionStatusRail } from "@/components/layout/session-status-rail";
import { StudioShell } from "@/components/layout/studio-shell";
import { StudioControlDeck } from "@/components/studio/studio-control-deck";
import { StudioHeader } from "@/components/studio/studio-header";
import { StudioMainStage } from "@/components/studio/studio-main-stage";
import {
  StudioAuthGate,
  StudioConnectionError,
  StudioLoadingState,
  StudioPageFallback,
} from "@/components/studio/studio-page-states";
import { StudioRecordingConsent } from "@/components/studio/studio-recording-consent";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { KeyboardShortcutsOverlay } from "@/components/ui/keyboard-shortcuts-overlay";
import { useStudioPage } from "@/lib/hooks/use-studio-page";

function StudioPageContent() {
  const { roomId } = useParams() as { roomId: string };
  const page = useStudioPage(roomId);

  if (!page.authStateIsLoading && !page.authStateData) {
    return <StudioAuthGate onSignIn={() => page.router.push("/auth/signin")} />;
  }

  if (page.connection.phase === "error" || page.connection.error) {
    return (
      <StudioConnectionError
        message={page.connectionError ?? "Connection failed"}
        onReturn={() => page.router.push("/dashboard")}
      />
    );
  }

  if (page.connection.phase !== "connected" || !page.roomDetails || !page.sessionUser) {
    return <StudioLoadingState />;
  }

  const { roomDetails, sessionUser } = page;

  return (
    <RoomContext.Provider value={page.room}>
      <StudioShell>
        <StudioHeader
          roomName={roomDetails.name}
          roomCode={roomDetails.code}
          operatorLabel={page.operatorLabel}
          canControlStudio={page.canControlStudio}
          isCreator={!!page.isCreator}
          connectionHealth={page.connectionHealth}
          connectionError={page.connectionError}
          isRecording={page.isRecording}
          isPaused={page.isPaused}
          recordingSeconds={page.recordingSeconds}
          onReturn={() => page.router.push("/dashboard")}
          onToggleSidebar={() => page.setSidebarOpen((p) => !p)}
          onStartRecording={() => void page.handleStartRecording()}
          onStopRecording={() => void page.handleStopRecording()}
          onTogglePause={page.handleTogglePause}
        />

        {page.isRecording || page.connectionHealth !== "connected" ? (
          <div className="border-border shrink-0 border-b px-4 py-2 md:px-5">
            <SessionStatusRail
              isRecording={page.isRecording}
              isPaused={page.isPaused}
              uploadStatus={page.isRecording ? "recording" : undefined}
              syncOk={page.connectionHealth === "connected"}
            />
          </div>
        ) : null}

        <div className="flex flex-1 overflow-hidden">
          <StudioMainStage />
          <StudioSidebar
            open={page.sidebarOpen}
            tab={page.sidebarTab}
            onTabChange={page.setSidebarTab}
            onClose={() => page.setSidebarOpen(false)}
            roomDbId={roomDetails.id}
            sessionUser={sessionUser}
            sessionRole={page.sessionRole}
            canControlStudio={page.canControlStudio}
            isRecording={page.isRecording}
            connectionHealth={page.connectionHealth}
            progressMap={page.progressMap}
            micDeviceId={page.micId}
            camDeviceId={page.camId}
            onBroadcastMuteRequest={page.broadcastMuteRequest}
          />
        </div>

        <footer className="border-border bg-card z-10 flex h-16 shrink-0 items-center justify-center border-t-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_0_0_var(--color-border)]">
          <StudioControlDeck />
        </footer>

        <KeyboardShortcutsOverlay
          open={page.shortcutsOpen}
          onClose={() => page.setShortcutsOpen(false)}
        />
        <StudioRecordingConsent
          open={page.consentOpen}
          onAccept={() => void page.handleConsentAccept()}
          onDecline={page.handleConsentDecline}
          loading={page.consentMutation.isPending}
        />
      </StudioShell>
    </RoomContext.Provider>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioPageFallback />}>
      <StudioPageContent />
    </Suspense>
  );
}
