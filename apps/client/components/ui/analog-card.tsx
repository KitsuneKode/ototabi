import { cn } from "@/lib/utils";

interface AnalogCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: "div" | "section" | "article" | "aside";
  /** Subtle chassis lift + scale on hover (marketing / clickable tiles). */
  interactive?: boolean;
}

/**
 * Analog chassis card — the foundational surface primitive.
 * Uses `chassis-shadow` utility for the raised bevel + drop shadow look.
 */
export function AnalogCard({
  children,
  className,
  as: Tag = "div",
  interactive = false,
  ...props
}: AnalogCardProps) {
  return (
    <Tag
      className={cn(
        "bg-card border-border chassis-shadow rounded-lg border",
        interactive &&
          "transition-[transform,filter,box-shadow] duration-700 ease-[var(--ease-mechanical)] hover:scale-[1.01] hover:brightness-105 motion-safe:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface AnalogInsetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Inset recessed panel — darker bg-popover with inner shadow.
 * Used for displays, meters, and data read-outs inside a chassis card.
 */
export function AnalogInset({ children, className, ...props }: AnalogInsetProps) {
  return (
    <div
      className={cn("bg-popover border-border rounded border shadow-inner", className)}
      {...props}
    >
      {children}
    </div>
  );
}
