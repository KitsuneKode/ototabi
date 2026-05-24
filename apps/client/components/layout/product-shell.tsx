import { NoiseBackground } from "@/components/ui/retro-primitives";
import { cn } from "@/lib/utils";

interface ProductShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Shared frame for marketing, auth, and other public product surfaces.
 */
export function ProductShell({ children, className, contentClassName }: ProductShellProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground selection:bg-accent/25 selection:text-foreground relative flex min-h-[100dvh] flex-col overflow-x-hidden font-sans",
        className,
      )}
    >
      <NoiseBackground />
      <div aria-hidden="true" className="studio-atmosphere pointer-events-none fixed inset-0 z-0" />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
