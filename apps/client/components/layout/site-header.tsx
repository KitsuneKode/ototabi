"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MechButton } from "@/components/ui/retro-primitives";
import { useSessionQuery } from "@/lib/hooks/use-session";
import { Menu, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#workflow", label: "Workflow" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

function HeaderLeds() {
  return (
    <div className="hidden items-end gap-5 sm:flex" aria-hidden="true">
      <div className="flex flex-col items-center gap-1.5">
        <div className="led-amber h-2.5 w-2.5 rounded-full" />
        <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
          PWR
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="led-green h-3 w-3 rounded-full" />
        <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
          SYNC
        </span>
      </div>
    </div>
  );
}

function MarketingAuthLinks({
  onNavigate,
  layout,
}: {
  onNavigate?: () => void;
  layout: "mobile" | "desktop";
}) {
  const authState = useSessionQuery();
  const user = authState.data?.user;

  if (user) {
    if (layout === "mobile") {
      return (
        <>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="text-foreground hover:bg-muted rounded-md px-3 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-150"
          >
            Dashboard
          </Link>
          <Link href="/dashboard" onClick={onNavigate} className="mt-2">
            <MechButton type="button" className="w-full">
              Open Studio
            </MechButton>
          </Link>
        </>
      );
    }

    return (
      <>
        <Link
          href="/dashboard"
          className="hover:text-foreground px-1 py-2 transition-colors duration-150"
        >
          Dashboard
        </Link>
        <Link href="/dashboard">
          <MechButton type="button" className="text-xs">
            Open Studio
          </MechButton>
        </Link>
      </>
    );
  }

  if (layout === "mobile") {
    return (
      <>
        <Link
          href="/auth/signin"
          onClick={onNavigate}
          className="text-muted-foreground hover:text-accent px-3 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-150"
        >
          Sign In
        </Link>
        <Link href="/auth/signup" onClick={onNavigate} className="mt-2">
          <MechButton type="button" className="w-full">
            Start Recording
          </MechButton>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/auth/signin"
        className="hover:text-foreground px-1 py-2 transition-colors duration-150"
      >
        Sign In
      </Link>
      <Link href="/auth/signup">
        <MechButton type="button" className="text-xs">
          Start Recording
        </MechButton>
      </Link>
    </>
  );
}

function MobileNavPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="border-border bg-card chassis-shadow fixed inset-x-4 top-[4.5rem] z-50 rounded-lg border p-4 md:hidden">
      <nav className="flex flex-col gap-1" aria-label="Mobile">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="text-foreground hover:bg-muted rounded-md px-3 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-150"
          >
            {link.label}
          </Link>
        ))}
        <MarketingAuthLinks onNavigate={onClose} layout="mobile" />
      </nav>
    </div>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <header className="border-border mb-12 flex items-end justify-between gap-4 border-b pb-5">
      <div className="min-w-0 flex-1">
        <Link href="/" className="group block">
          <h1 className="font-display text-foreground m-0 text-3xl leading-none font-bold tracking-tight uppercase transition-opacity duration-150 group-hover:opacity-90 md:text-4xl">
            Ototabi Studio
          </h1>
          <span className="text-subtle-foreground mt-1.5 block font-mono text-[10px] tracking-widest uppercase">
            Model 16-A // Local-First Remote Recording
          </span>
        </Link>
      </div>

      <div className="flex items-end gap-4 md:gap-6">
        <HeaderLeds />
        <ThemeToggle className="hidden sm:inline-flex" />

        <nav
          className="text-subtle-foreground hidden items-center gap-6 font-mono text-[11px] font-bold tracking-widest uppercase md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <MarketingAuthLinks layout="desktop" />
        </nav>

        <button
          type="button"
          className={cn(
            "border-border bg-card chassis-shadow relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border md:hidden",
            "transition-transform duration-150 active:scale-[0.96]",
          )}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <MobileNavPanel open={menuOpen} onClose={closeMenu} />
    </header>
  );
}
