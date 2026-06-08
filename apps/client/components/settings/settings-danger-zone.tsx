"use client";

import type { RefObject } from "react";

import { Input } from "@ototabi/ui/components/input";
import { Label } from "@ototabi/ui/components/label";

import { AnalogCard } from "@/components/ui/analog-card";
import { PanelTitle, MechButton } from "@/components/ui/retro-primitives";
import { Trash2, ShieldAlert } from "@/lib/icons";

type SettingsDangerZoneProps = {
  deleteDialogRef: RefObject<HTMLDialogElement | null>;
  onOpenDeleteModal: () => void;
  onCloseDeleteModal: () => void;
  deleteConfirm: string;
  onDeleteConfirmChange: (value: string) => void;
  confirmMatch: boolean;
  isDeleting: boolean;
  onDeleteAccount: () => void;
};

export function SettingsDangerZone({
  deleteDialogRef,
  onCloseDeleteModal,
  deleteConfirm,
  onDeleteConfirmChange,
  confirmMatch,
  isDeleting,
  onDeleteAccount,
  onOpenDeleteModal,
}: SettingsDangerZoneProps) {
  return (
    <>
      <AnalogCard className="border-led-on/20 space-y-4 p-6">
        <PanelTitle label="⚠ Danger Zone" title="Delete Account" />
        <p className="text-muted-foreground font-mono text-xs leading-relaxed">
          Permanently deletes your operator profile and all associated data. Uploaded recordings in
          object storage are not removed. This action cannot be undone.
        </p>
        <MechButton
          variant="danger"
          onClick={onOpenDeleteModal}
          className="h-11 w-full justify-center text-sm"
        >
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </MechButton>
      </AnalogCard>

      <dialog
        ref={deleteDialogRef}
        onClose={onCloseDeleteModal}
        onCancel={onCloseDeleteModal}
        aria-labelledby="delete-account-title"
        className="backdrop:bg-background/80 border-0 bg-transparent p-4 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
      >
        <AnalogCard className="animate-in fade-in zoom-in-95 w-full max-w-md space-y-6 p-8 duration-200">
          <div>
            <div className="flex items-start gap-4">
              <div className="bg-led-on/10 border-led-on/30 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                <ShieldAlert className="text-led-on h-5 w-5" />
              </div>
              <div>
                <h3
                  id="delete-account-title"
                  className="text-lg font-bold tracking-tight uppercase"
                >
                  Confirm Account Deletion
                </h3>
                <p className="text-muted-foreground mt-1 font-mono text-xs leading-relaxed">
                  Type <span className="text-accent font-bold">delete my account</span> to confirm.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                Confirmation Phrase
              </Label>
              <Input
                type="text"
                value={deleteConfirm}
                onChange={(e) => onDeleteConfirmChange(e.target.value)}
                placeholder="delete my account"
                className="border-border bg-popover text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-led-on/40 h-11 rounded border font-mono text-sm shadow-inner focus-visible:ring-1"
              />
            </div>

            <div className="flex gap-3">
              <MechButton onClick={onCloseDeleteModal} className="flex-1 justify-center">
                Cancel
              </MechButton>
              <MechButton
                variant="danger"
                onClick={onDeleteAccount}
                disabled={!confirmMatch || isDeleting}
                className="flex-1 justify-center"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "DELETING..." : "CONFIRM"}
              </MechButton>
            </div>
          </div>
        </AnalogCard>
      </dialog>
    </>
  );
}
