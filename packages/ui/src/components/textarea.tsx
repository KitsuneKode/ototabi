import { cn } from "@ototabi/ui/lib/utils";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-border flex min-h-20 w-full min-w-0 rounded-md border-2 bg-[#111111] px-3 py-2 font-mono text-base tracking-wider text-[#e0e0e0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
