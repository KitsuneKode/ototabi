"use client";

import { AnalogCard } from "@/components/ui/analog-card";
import { PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { LogOut } from "@/lib/icons";

type SettingsSessionSectionProps = {
  onSignOut: () => void;
};

export function SettingsSessionSection({ onSignOut }: SettingsSessionSectionProps) {
  return (
    <AnalogCard className="space-y-4 p-6">
      <PanelTitle label="Auth Module" title="Session" />
      <MechButton
        onClick={onSignOut}
        variant="danger"
        className="h-11 w-full justify-center text-sm"
      >
        <LogOut className="h-4 w-4" />
        Sign Out of All Devices
      </MechButton>
    </AnalogCard>
  );
}
