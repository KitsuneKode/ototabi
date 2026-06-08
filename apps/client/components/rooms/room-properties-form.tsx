"use client";

import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { Copy, Save, ShieldAlert } from "@/lib/icons";

type RoomPropertiesFormProps = {
  roomName: string;
  roomCode: string;
  copied: boolean;
  saveError: string;
  saveSuccess: boolean;
  isSaving: boolean;
  onRoomNameChange: (value: string) => void;
  onCopyCode: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function RoomPropertiesForm({
  roomName,
  roomCode,
  copied,
  saveError,
  saveSuccess,
  isSaving,
  onRoomNameChange,
  onCopyCode,
  onSubmit,
}: RoomPropertiesFormProps) {
  return (
    <AnalogCard className="space-y-6 p-6">
      <PanelTitle label="Channel Config" title="Room Properties" />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="room-name"
            className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase"
          >
            Room Name
          </Label>
          <Input
            id="room-name"
            type="text"
            required
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-11 rounded border font-mono text-sm shadow-inner focus-visible:ring-1"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
            Room Code (Read-Only)
          </Label>
          <AnalogInset className="flex h-11 items-center gap-3 px-3">
            <span className="text-accent font-mono text-sm font-bold tracking-widest">
              {roomCode}
            </span>
            <button
              type="button"
              onClick={onCopyCode}
              className="btn-mechanical text-secondary-foreground ml-auto flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
            >
              <Copy className="h-3 w-3" />
              {copied ? "COPIED!" : "COPY CODE"}
            </button>
          </AnalogInset>
        </div>

        {saveError ? (
          <div className="border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded border p-3">
            <ShieldAlert className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-destructive font-mono text-xs uppercase">{saveError}</p>
          </div>
        ) : null}

        {saveSuccess ? (
          <div className="border-led-green/30 bg-led-green/10 flex items-center gap-2 rounded border p-3">
            <LedInline color="green" size="sm" />
            <MonoLabel className="text-led-green">Room name updated successfully.</MonoLabel>
          </div>
        ) : null}

        <MechButton
          type="submit"
          disabled={isSaving}
          className="h-11 w-full justify-center text-sm"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "SAVING..." : "SAVE CHANGES"}
        </MechButton>
      </form>
    </AnalogCard>
  );
}
