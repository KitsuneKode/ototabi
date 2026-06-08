"use client";

import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { RoomDangerZone } from "@/components/rooms/room-danger-zone";
import { RoomInvitesPanel } from "@/components/rooms/room-invites-panel";
import { RoomMembersPanel } from "@/components/rooms/room-members-panel";
import { RoomPropertiesForm } from "@/components/rooms/room-properties-form";
import { RoomRecentSessionsPanel } from "@/components/rooms/room-recent-sessions-panel";
import { RoomStudioAccessPanel } from "@/components/rooms/room-studio-access-panel";
import { AnalogCard } from "@/components/ui/analog-card";
import { PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { useRoomSettingsPage } from "@/lib/hooks/use-room-settings-page";
import { ArrowLeft, AlertTriangle } from "@/lib/icons";

export default function RoomSettingsPage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const page = useRoomSettingsPage(roomId);

  if (!page.authStateIsLoading && !page.isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <MechButton
          onClick={() => router.push("/auth/signin")}
          className="w-full max-w-xs justify-center"
        >
          Sign In Required
        </MechButton>
      </div>
    );
  }

  if (page.roomInfoIsLoading) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Room Config...
          </span>
        </div>
      </div>
    );
  }

  if (!page.roomInfo) {
    return (
      <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 font-sans">
        <AnalogCard className="w-full max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-10 w-10" />
          <p className="text-led-on mb-4 text-sm font-bold uppercase">Room Not Found</p>
          <MechButton onClick={() => router.push("/dashboard")} className="w-full justify-center">
            Back to Dashboard
          </MechButton>
        </AnalogCard>
      </div>
    );
  }

  const data = page.roomInfo;

  return (
    <AppShell maxWidth="max-w-3xl">
      <div className="space-y-8">
        <PageHeader
          label={`${data.name} // ${data.code}`}
          title="Room Settings"
          actions={
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
          }
        />

        <RoomPropertiesForm
          roomName={page.roomName}
          roomCode={data.code}
          copied={page.copied}
          saveError={page.saveError}
          saveSuccess={page.saveSuccess}
          isSaving={page.updateMutation.isPending}
          onRoomNameChange={(value) => page.setRoomNameDraft(value)}
          onCopyCode={page.handleCopyLink}
          onSubmit={page.handleSave}
        />

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Crew Roster" title="Room Members" className="mb-4" />
          <RoomMembersPanel roomId={data.id} />
        </AnalogCard>

        <RoomStudioAccessPanel
          roomId={data.id}
          isLocked={data.isLocked}
          onLockChanged={() => void page.roomInfoRefetch()}
        />

        <AnalogCard className="space-y-4 p-6">
          <PanelTitle label="Secure Access" title="Invite Links" className="mb-4" />
          <RoomInvitesPanel roomId={data.id} roomCode={data.code} />
        </AnalogCard>

        <RoomRecentSessionsPanel sessions={page.sessions} isLoading={page.sessionsIsLoading} />

        <RoomDangerZone
          roomCode={data.code}
          deleteDialogRef={page.deleteDialogRef}
          onOpenDeleteModal={() => page.setShowDeleteModal(true)}
          onCloseDeleteModal={page.closeDeleteModal}
          deleteConfirm={page.deleteConfirm}
          onDeleteConfirmChange={page.setDeleteConfirm}
          confirmMatch={page.confirmMatch}
          isDeleting={page.deleteMutation.isPending}
          onDelete={page.handleDelete}
        />
      </div>
    </AppShell>
  );
}
