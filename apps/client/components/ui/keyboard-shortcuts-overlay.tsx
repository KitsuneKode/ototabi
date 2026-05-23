"use client";

import { useEffect, useRef } from "react";

import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { SHORTCUTS } from "@/lib/hooks/use-keyboard-shortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsOverlay({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="border-border text-foreground rounded-xl border-2 bg-black/80 p-0 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md open:flex open:flex-col"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <AnalogCard className="m-0 min-w-[320px] border-0 bg-transparent">
        <div className="border-border/40 flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-sm font-bold tracking-widest uppercase">Keyboard Shortcuts</h2>
          <MonoLabel className="text-muted-foreground">Press ? to toggle</MonoLabel>
        </div>

        <div className="space-y-1.5 p-4">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-foreground font-mono text-xs">{s.label}</span>
              <kbd className="border-border bg-popover text-accent rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase shadow-sm">
                {s.keys.join(" or ")}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-border/40 border-t px-6 py-3">
          <MonoLabel className="text-muted-foreground/60">
            Push-to-talk: hold Space, release to mute
          </MonoLabel>
        </div>
      </AnalogCard>
    </dialog>
  );
}
