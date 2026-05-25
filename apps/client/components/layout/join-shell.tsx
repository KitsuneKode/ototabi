import { ProductShell } from "@/components/layout/product-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

type JoinShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Shared frame for room join / pre-flight surfaces.
 */
export function JoinShell({ children, title, subtitle, className }: JoinShellProps) {
  return (
    <ProductShell contentClassName="max-w-4xl">
      <SiteHeader />
      <div className={cn("flex flex-1 flex-col py-6 md:py-10", className)}>
        <header className="border-border mb-8 border-b pb-6">
          <h1 className="font-display text-foreground text-2xl font-bold tracking-tight uppercase md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-2 max-w-xl font-mono text-xs leading-relaxed tracking-wide uppercase">
              {subtitle}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </ProductShell>
  );
}
