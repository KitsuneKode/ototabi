"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Moon, Sun } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className={cn(
          "border-border bg-card inline-flex h-9 w-9 shrink-0 rounded-md border",
          className,
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "border-border bg-card chassis-shadow text-muted-foreground hover:text-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
        "focus-visible:ring-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:outline-none",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
