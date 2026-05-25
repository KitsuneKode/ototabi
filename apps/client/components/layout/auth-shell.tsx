import { OtotabiLogoLockup } from "@/components/brand/ototabi-logo";
import { ProductShell } from "@/components/layout/product-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalogReveal } from "@/components/ui/analog-reveal";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <ProductShell contentClassName="justify-center">
      <div className="border-border mb-8 flex items-end justify-between border-b-2 pb-4">
        <OtotabiLogoLockup href="/" subtitle={subtitle} markClassName="h-10 w-10" />
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="led-amber h-3 w-3 animate-pulse rounded-full" />
          <span className="text-muted-foreground hidden font-mono text-[9px] font-bold tracking-widest uppercase sm:inline">
            PWR
          </span>
        </div>
      </div>

      <AnalogReveal className="mx-auto w-full max-w-md">
        <div className="bg-card border-border chassis-shadow rounded-xl border p-8">
          <h1 className="font-display mb-6 text-3xl leading-none font-bold tracking-tight uppercase">
            {title}
          </h1>
          {children}
        </div>
      </AnalogReveal>

      <SiteFooter />
    </ProductShell>
  );
}
