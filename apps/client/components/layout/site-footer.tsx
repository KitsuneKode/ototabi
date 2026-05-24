import Link from "next/link";

import { cn } from "@/lib/utils";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#workflow", label: "Workflow" },
      { href: "/#features", label: "Features" },
      { href: "/#faq", label: "FAQ" },
      { href: "/demo", label: "Demo" },
    ],
  },
  {
    title: "Studio",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/recovery", label: "Recovery" },
      { href: "/auth/signup", label: "Create room" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth/signup", label: "Sign up" },
      { href: "/auth/signin", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

function BrandMark() {
  return (
    <div
      className="border-border bg-card text-foreground chassis-shadow flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono text-sm font-bold"
      aria-hidden="true"
    >
      O
    </div>
  );
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
        {title}
      </span>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-subtle-foreground hover:text-foreground text-sm transition-colors duration-150"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-border relative mt-24 border-t pt-14 pb-6", className)}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-5 lg:col-span-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="font-display text-foreground text-lg font-bold tracking-tight uppercase">
              Ototabi Studio
            </span>
          </div>
          <p className="text-subtle-foreground max-w-xs text-sm leading-relaxed text-pretty">
            Local-first remote recording for creators who need masters they can trust.
          </p>
          <p className="text-subtle-foreground font-mono text-[10px] tracking-widest uppercase">
            &copy; {year} Ototabi Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="led-green h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            <span className="text-subtle-foreground font-mono text-[9px] font-bold tracking-widest uppercase">
              Systems nominal
            </span>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8" aria-label="Footer">
          {FOOTER_COLUMNS.map((column) => (
            <FooterLinkColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </nav>
      </div>

      <div
        className="footer-watermark pointer-events-none mt-10 overflow-hidden text-center select-none md:mt-14"
        aria-hidden="true"
      >
        <span className="font-display block text-[clamp(3.5rem,14vw,10rem)] font-bold tracking-tighter uppercase">
          Ototabi
        </span>
      </div>
    </footer>
  );
}
