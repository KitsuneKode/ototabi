import { cn } from "@/lib/utils";

interface MonoLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "p" | "div" | "label";
  htmlFor?: string;
}

/**
 * Standard mono label — used for all panel section labels and input labels.
 * Courier Prime, 10px, bold, uppercase, widest tracking, muted-foreground.
 */
export function MonoLabel({
  children,
  className,
  as: Tag = "span",
  htmlFor,
  ...props
}: MonoLabelProps) {
  return (
    <Tag
      className={cn(
        "text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase",
        className,
      )}
      {...(htmlFor ? { htmlFor } : {})}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface PanelTitleProps {
  label?: string; // small mono label above
  title: string; // main heading
  className?: string;
}

/**
 * Standard panel title block — mono sub-label + Oswald heading.
 */
export function PanelTitle({ label, title, className }: PanelTitleProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && <MonoLabel>{label}</MonoLabel>}
      <h2 className="text-xl font-bold tracking-tight uppercase">{title}</h2>
    </div>
  );
}

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "recording" | "ok" | "warn";
  className?: string;
}

const badgeVariants: Record<NonNullable<StatusBadgeProps["variant"]>, string> = {
  default: "bg-popover border-border text-muted-foreground",
  recording: "bg-led-on/10 border-led-on text-led-on",
  ok: "bg-led-green/10 border-led-green text-led-green",
  warn: "bg-accent/10 border-accent text-accent",
};

/**
 * Inline status badge — Retro Analog label style with coloured border.
 */
export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface NoiseBackgroundProps {
  className?: string;
}

/**
 * Fixed mechanical noise overlay — place once per page, pointer-events-none.
 */
export function NoiseBackground({ className }: NoiseBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("noise-texture pointer-events-none fixed inset-0 z-0", className)}
    />
  );
}

interface MechButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "danger";
}

/**
 * Mechanical button — uses btn-mechanical CSS utility for the raised feel.
 * active:translate-y-[2px] is baked in via the utility class.
 */
export function MechButton({
  children,
  className,
  variant = "default",
  ...props
}: MechButtonProps) {
  return (
    <button
      className={cn(
        "btn-mechanical text-secondary-foreground inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-widest uppercase",
        variant === "danger" &&
          "from-destructive/80 to-destructive border-destructive/60 text-destructive-foreground bg-gradient-to-b shadow-none hover:brightness-110",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
