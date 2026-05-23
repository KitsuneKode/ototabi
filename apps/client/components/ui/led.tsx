import { cn } from "@/lib/utils";

type LedColor = "red" | "red-off" | "green" | "green-off" | "amber";
type LedSize = "sm" | "md" | "lg";

interface LedProps {
  color?: LedColor;
  size?: LedSize;
  pulse?: boolean;
  label?: string;
  className?: string;
}

const colorMap: Record<LedColor, string> = {
  red: "led-red",
  "red-off": "led-red-off",
  green: "led-green",
  "green-off": "led-green-off",
  amber: "led-amber",
};

const sizeMap: Record<LedSize, string> = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

/**
 * LED indicator dot with optional label underneath.
 * Color maps to the design system's LED tokens — never hardcoded.
 */
export function Led({ color = "red-off", size = "md", pulse = false, label, className }: LedProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn("rounded-full", colorMap[color], sizeMap[size], pulse && "animate-pulse")}
      />
      {label && (
        <span className="text-muted-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Inline LED — no label, horizontal layout. Used in status badges.
 */
export function LedInline({
  color = "red-off",
  size = "sm",
  pulse = false,
  className,
}: Omit<LedProps, "label">) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full",
        colorMap[color],
        sizeMap[size],
        pulse && "animate-pulse",
        className,
      )}
    />
  );
}
