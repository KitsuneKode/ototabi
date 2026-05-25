"use client";

import { authClient } from "@ototabi/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NoiseBackground } from "@/components/ui/retro-primitives";
import { useSessionQuery } from "@/lib/hooks/use-session";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Settings,
  Sliders,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recovery", label: "Recovery", icon: HardDrive },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function AppNavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-[11px] font-bold tracking-widest uppercase transition-colors duration-150",
        active
          ? "bg-popover text-accent border-border border"
          : "text-muted-foreground hover:bg-popover/60 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {collapsed ? null : <span>{label}</span>}
    </Link>
  );
}

export function AppShell({
  children,
  maxWidth = "max-w-6xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const authState = useSessionQuery();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => !value);
  }, []);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    queryClient.setQueryData(trpc.auth.getSession.queryOptions().queryKey, null);
    router.push("/auth/signin");
  }, [queryClient, router, trpc]);

  const userName = authState.data?.user?.name ?? "Operator";
  const userEmail = authState.data?.user?.email ?? "";

  return (
    <div className="bg-background text-foreground relative flex min-h-[100dvh] font-sans">
      <NoiseBackground />

      <aside
        className={cn(
          "border-border bg-background relative z-10 flex shrink-0 flex-col border-r transition-[width] duration-200 ease-[var(--ease-mechanical)]",
          collapsed ? "w-[4.25rem]" : "w-56",
        )}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-4">
          {collapsed ? null : (
            <Link href="/dashboard" className="min-w-0">
              <span className="font-display block text-lg font-bold tracking-tight uppercase">
                Ototabi
              </span>
              <span className="text-subtle-foreground font-mono text-[9px] tracking-widest uppercase">
                Studio Console
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="border-border bg-card text-muted-foreground hover:text-foreground ml-auto flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="App">
          {NAV_ITEMS.map((item) => (
            <AppNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>

        <div className="border-border space-y-2 border-t p-2">
          <div className="flex items-center justify-center gap-2 px-1">
            <ThemeToggle />
            {collapsed ? null : (
              <Link
                href="/"
                className="text-subtle-foreground hover:text-foreground flex-1 py-2 text-center font-mono text-[10px] font-bold tracking-widest uppercase transition-colors"
              >
                Marketing
              </Link>
            )}
          </div>
          {collapsed ? null : (
            <div className="bg-popover border-border rounded-md border px-3 py-2">
              <p className="truncate text-xs font-bold uppercase">{userName}</p>
              <p className="text-muted-foreground truncate font-mono text-[9px]">{userEmail}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors",
              "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {collapsed ? null : <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <main className={cn("mx-auto w-full flex-1 px-4 py-6 md:px-8 md:py-8", maxWidth)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShellQuickLinks() {
  return (
    <div className="text-muted-foreground flex flex-wrap gap-4 font-mono text-[10px] font-bold tracking-widest uppercase">
      <Link
        href="/dashboard"
        className="hover:text-accent inline-flex items-center gap-1.5 transition-colors"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Rooms
      </Link>
      <Link
        href="/recovery"
        className="hover:text-accent inline-flex items-center gap-1.5 transition-colors"
      >
        <HardDrive className="h-3.5 w-3.5" />
        Recovery
      </Link>
      <Link
        href="/settings"
        className="hover:text-accent inline-flex items-center gap-1.5 transition-colors"
      >
        <Sliders className="h-3.5 w-3.5" />
        Settings
      </Link>
      <Link
        href="/recordings"
        className="hover:text-accent inline-flex items-center gap-1.5 transition-colors"
      >
        <Film className="h-3.5 w-3.5" />
        Sessions
      </Link>
    </div>
  );
}
