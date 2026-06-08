"use client";

import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel } from "@/components/ui/retro-primitives";
import { formatDate } from "@/lib/date-utils";

type SettingsProfileBannerProps = {
  name: string;
  email: string;
  createdAt: Date | string;
};

export function SettingsProfileBanner({ name, email, createdAt }: SettingsProfileBannerProps) {
  return (
    <AnalogCard className="flex items-center gap-4 p-5">
      <div className="bg-accent/10 border-accent/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2">
        <span className="text-accent text-2xl font-bold uppercase">
          {name?.[0] ?? email?.[0] ?? "?"}
        </span>
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight uppercase">{name}</p>
        <MonoLabel>{email}</MonoLabel>
        <MonoLabel className="mt-1 text-[9px]">Joined: {formatDate(createdAt)}</MonoLabel>
      </div>
    </AnalogCard>
  );
}
