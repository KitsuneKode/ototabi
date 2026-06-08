"use client";

import { useTheme } from "next-themes";

import { AnalogCard } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle } from "@/components/ui/retro-primitives";
import { Moon, Sun, Monitor } from "@/lib/icons";

const THEMES = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function SettingsAppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <AnalogCard className="space-y-4 p-6">
      <PanelTitle label="Display Console" title="Appearance" />
      <div>
        <MonoLabel className="mb-3 block">Theme Mode</MonoLabel>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 rounded border p-4 transition-[border-color,background-color] ${
                theme === value
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border bg-card text-muted-foreground hover:border-border/80"
              }`}
            >
              <Icon className="h-5 w-5" />
              <MonoLabel className={theme === value ? "text-accent" : ""}>{label}</MonoLabel>
            </button>
          ))}
        </div>
      </div>
    </AnalogCard>
  );
}
