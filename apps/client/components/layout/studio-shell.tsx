import { NoiseBackground } from "@/components/ui/retro-primitives";
import { cn } from "@/lib/utils";

type StudioShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Full-viewport cockpit frame for LiveKit studio sessions.
 */
export function StudioShell({ children, className }: StudioShellProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground relative flex h-[100dvh] flex-col overflow-hidden font-sans",
        className,
      )}
    >
      <NoiseBackground />
      <div aria-hidden="true" className="studio-atmosphere pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
