"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { SessionReviewTrack } from "@/lib/trpc/router-types";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

type TrackPickerProps = {
  id?: string;
  label: string;
  tracks: SessionReviewTrack[];
  value: string | null;
  onChange: (trackId: string | null) => void;
  placeholder?: string;
};

export function TrackPicker({
  id: idProp,
  label,
  tracks,
  value,
  onChange,
  placeholder = "— Select —",
}: TrackPickerProps) {
  const generatedId = useId();
  const triggerId = idProp ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = tracks.find((t) => t.id === value) ?? null;
  const selectedLabel = selected
    ? `${selected.type} — ${selected.user?.name ?? "Unknown"}`
    : placeholder;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <MonoLabel as="label" htmlFor={triggerId} className="mb-1.5 block">
        {label}
      </MonoLabel>
      <button
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className="bg-card border-border focus-visible:border-accent focus-visible:ring-accent/40 flex w-full items-center justify-between gap-2 rounded border px-2 py-1.5 font-mono text-xs uppercase focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <AnalogInset
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="border-border absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border p-1 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "hover:bg-popover focus-visible:bg-popover w-full rounded px-2 py-1.5 text-left font-mono text-xs focus-visible:outline-none",
              value === null && "bg-popover text-accent",
            )}
          >
            {placeholder}
          </button>
          {tracks.map((track) => {
            const optionLabel = `${track.type} — ${track.user?.name ?? "Unknown"}`;
            const isSelected = value === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(track.id);
                  setOpen(false);
                }}
                className={cn(
                  "hover:bg-popover focus-visible:bg-popover w-full rounded px-2 py-1.5 text-left font-mono text-xs focus-visible:outline-none",
                  isSelected && "bg-popover text-accent",
                )}
              >
                {optionLabel}
              </button>
            );
          })}
        </AnalogInset>
      ) : null}
    </div>
  );
}
