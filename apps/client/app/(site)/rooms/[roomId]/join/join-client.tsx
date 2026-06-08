"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import { JoinControlsPanel } from "@/components/join/join-controls-panel";
import {
  JoinErrorState,
  JoinLoadingState,
  JoinPageFallback,
} from "@/components/join/join-page-states";
import { JoinPreviewPanel } from "@/components/join/join-preview-panel";
import { JoinShell } from "@/components/layout/join-shell";
import { AnalogCard } from "@/components/ui/analog-card";
import { useJoinRoomPage } from "@/lib/hooks/use-join-room-page";

function RoomJoinPageContent() {
  const { roomId } = useParams() as { roomId: string };
  const page = useJoinRoomPage(roomId);

  if (page.roomInfoIsLoading) {
    return <JoinLoadingState />;
  }

  if (page.roomInfoError || !page.roomInfoData || page.inviteInfoError) {
    return <JoinErrorState onReturn={() => page.router.push("/dashboard")} />;
  }

  const { media } = page;

  return (
    <JoinShell
      title="Studio Join"
      subtitle={`Room: ${page.roomInfoData.name} // Pre-flight calibration`}
    >
      <AnalogCard className="flex flex-col gap-8 overflow-hidden p-6 md:grid md:grid-cols-12 md:p-8">
        <JoinPreviewPanel
          roomName={page.roomInfoData.name}
          guestNeedsInvite={page.guestNeedsInvite}
          inviteInfo={page.inviteInfoData}
          videoEnabled={media.videoEnabled}
          audioEnabled={media.audioEnabled}
          audioLevel={media.audioLevel}
          stream={media.stream}
          videoRef={page.videoRef}
        />
        <JoinControlsPanel
          audioEnabled={media.audioEnabled}
          videoEnabled={media.videoEnabled}
          screenShareEnabled={media.screenShareEnabled}
          audioDevices={media.audioDevices}
          videoDevices={media.videoDevices}
          selectedMic={media.selectedMic}
          selectedCam={media.selectedCam}
          micError={media.micError}
          camError={media.camError}
          quality={media.quality}
          isSignedIn={page.isSignedIn}
          guestName={media.guestName}
          guestLoading={media.guestLoading}
          guestNeedsInvite={page.guestNeedsInvite}
          onAudioEnabledChange={(value) => page.dispatch({ type: "set_audio_enabled", value })}
          onVideoEnabledChange={(value) => page.dispatch({ type: "set_video_enabled", value })}
          onToggleScreenShare={() => page.dispatch({ type: "toggle_screen_share" })}
          onSelectedMicChange={(value) => page.dispatch({ type: "set_selected_mic", value })}
          onSelectedCamChange={(value) => page.dispatch({ type: "set_selected_cam", value })}
          onQualityChange={(value) => page.dispatch({ type: "set_quality", value })}
          onGuestNameChange={(value) => page.dispatch({ type: "set_guest_name", value })}
          onJoin={() => void page.joinRoom()}
        />
      </AnalogCard>
    </JoinShell>
  );
}

export default function RoomJoinPage() {
  return (
    <Suspense fallback={<JoinPageFallback />}>
      <RoomJoinPageContent />
    </Suspense>
  );
}
