import { cn } from "@ototabi/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold uppercase tracking-wider transition-all duration-150 ease-[var(--ease-mechanical)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] active:translate-y-[2px] active:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-secondary to-muted border border-border text-secondary-foreground shadow-[0_4px_6px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] hover:brightness-105",
        destructive:
          "bg-destructive text-white border border-border shadow-[0_4px_6px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:brightness-110",
        outline:
          "border border-border bg-background shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:translate-y-0 active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0 active:shadow-none",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-8 has-[>svg]:px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
