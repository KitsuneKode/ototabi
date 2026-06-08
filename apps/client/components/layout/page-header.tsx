import type { ReactNode } from "react";

import { MonoLabel } from "@/components/ui/retro-primitives";
import { cn } from "@/lib/utils";

export function PageHeader({
  label,
  title,
  description,
  actions,
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "border-border flex flex-col gap-4 border-b-2 pb-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {label ? <MonoLabel>{label}</MonoLabel> : null}
        <h1 className="mt-1 text-3xl leading-none font-bold tracking-tight text-balance uppercase md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
