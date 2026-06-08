"use client";

import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { User, Mail, Save, ShieldAlert } from "@/lib/icons";

type SettingsProfileFormProps = {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  email: string | undefined;
  profileError: string;
  profileSuccess: boolean;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function SettingsProfileForm({
  displayName,
  onDisplayNameChange,
  email,
  profileError,
  profileSuccess,
  isSaving,
  onSubmit,
}: SettingsProfileFormProps) {
  return (
    <AnalogCard className="space-y-5 p-6">
      <PanelTitle label="Operator Profile" title="Edit Account" />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="display-name"
            className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase"
          >
            Display Name
          </Label>
          <div className="relative">
            <User className="text-muted-foreground/60 absolute top-3 left-3 h-4 w-4" />
            <Input
              id="display-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-11 rounded border pl-10 font-mono text-sm shadow-inner focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
            Email Address (Read-Only)
          </Label>
          <AnalogInset className="flex h-11 items-center gap-2 px-3">
            <Mail className="text-muted-foreground/60 h-4 w-4 shrink-0" />
            <span className="text-muted-foreground font-mono text-sm">{email}</span>
          </AnalogInset>
        </div>

        {profileError ? (
          <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2.5 rounded border p-3">
            <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-destructive font-mono text-xs uppercase">{profileError}</p>
          </div>
        ) : null}

        {profileSuccess ? (
          <div className="border-led-green/30 bg-led-green/10 flex items-center gap-2 rounded border p-3">
            <LedInline color="green" size="sm" />
            <MonoLabel className="text-led-green">Profile updated successfully.</MonoLabel>
          </div>
        ) : null}

        <MechButton
          type="submit"
          disabled={isSaving}
          className="h-11 w-full justify-center text-sm"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "SAVING..." : "SAVE PROFILE"}
        </MechButton>
      </form>
    </AnalogCard>
  );
}
