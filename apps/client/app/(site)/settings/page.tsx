"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsAppearanceSection } from "@/components/settings/settings-appearance-section";
import { SettingsBillingSection } from "@/components/settings/settings-billing-section";
import { SettingsDangerZone } from "@/components/settings/settings-danger-zone";
import { SettingsProfileBanner } from "@/components/settings/settings-profile-banner";
import { SettingsProfileForm } from "@/components/settings/settings-profile-form";
import { SettingsSessionSection } from "@/components/settings/settings-session-section";
import { MechButton } from "@/components/ui/retro-primitives";
import { useSettingsPage } from "@/lib/hooks/use-settings-page";
import { ArrowLeft } from "@/lib/icons";

export default function SettingsPage() {
  const router = useRouter();
  const page = useSettingsPage();

  if (page.meIsLoading) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="border-border border-t-accent h-8 w-8 animate-spin rounded-full border-2" />
          <span className="animate-pulse font-mono text-xs font-bold tracking-widest uppercase">
            Loading Operator Profile...
          </span>
        </div>
      </div>
    );
  }

  const user = page.user;

  return (
    <AppShell maxWidth="max-w-2xl">
      <div className="space-y-8">
        <PageHeader
          label="Operator profile"
          title="Settings"
          actions={
            <MechButton onClick={() => router.push("/dashboard")} className="h-9 px-2.5 py-2">
              <ArrowLeft className="h-4 w-4" />
            </MechButton>
          }
        />

        {user ? (
          <SettingsProfileBanner name={user.name} email={user.email} createdAt={user.createdAt} />
        ) : null}

        <SettingsAppearanceSection />

        <SettingsProfileForm
          displayName={page.displayName}
          onDisplayNameChange={page.setDisplayName}
          email={user?.email}
          profileError={page.profileError}
          profileSuccess={page.profileSuccess}
          isSaving={page.updateProfile.isPending}
          onSubmit={page.handleSaveProfile}
        />

        <SettingsBillingSection
          plan={page.subscriptionData?.plan}
          status={page.subscriptionData?.status}
          checkoutIsPending={page.checkoutIsPending}
          onStartCheckout={page.startCheckout}
        />

        <SettingsSessionSection onSignOut={page.handleSignOut} />

        <SettingsDangerZone
          deleteDialogRef={page.deleteDialogRef}
          onOpenDeleteModal={() => page.setShowDeleteModal(true)}
          onCloseDeleteModal={page.closeDeleteModal}
          deleteConfirm={page.deleteConfirm}
          onDeleteConfirmChange={page.setDeleteConfirm}
          confirmMatch={page.confirmMatch}
          isDeleting={page.deleteAccount.isPending}
          onDeleteAccount={page.handleDeleteAccount}
        />
      </div>
    </AppShell>
  );
}
