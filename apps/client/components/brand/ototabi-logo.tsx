import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

/** Tape-reel O + amber SYNC LED — matches Retro Analog mark in `.docs/brand.md`. */
export function OtotabiLogoMark({ className, title = "Ototabi" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.25"
      />
      <rect x="2.5" y="2.5" width="27" height="3" rx="1.5" fill="currentColor" fillOpacity="0.08" />
      <circle
        cx="16"
        cy="16"
        r="9.25"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.35"
      />
      <circle
        cx="16"
        cy="16"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="0.85"
      />
      <circle
        cx="16"
        cy="16"
        r="3.75"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="0.75"
      />
      <path
        d="M12.2 16c0-2.1 1.7-3.8 3.8-3.8 1.4 0 2.6.7 3.3 1.8"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="22.4" cy="10.8" r="2.35" className="fill-[#e8952a]" />
      <circle cx="22.4" cy="10.8" r="1.1" fill="#fff5e6" fillOpacity="0.55" />
    </svg>
  );
}

type LogoLockupProps = {
  href?: string;
  /** Primary wordmark line (default `Ototabi`). */
  title?: string;
  subtitle?: string | null;
  showSubtitle?: boolean;
  className?: string;
  markClassName?: string;
  onClick?: () => void;
};

export function OtotabiLogoLockup({
  href = "/",
  title = "Ototabi",
  subtitle = "Studio Console",
  showSubtitle = true,
  className,
  markClassName = "h-9 w-9",
  onClick,
}: LogoLockupProps) {
  const body = (
    <>
      <OtotabiLogoMark className={markClassName} />
      <span className="min-w-0">
        <span className="font-display text-foreground block text-lg leading-none font-bold tracking-tight uppercase md:text-xl">
          {title}
        </span>
        {showSubtitle && subtitle ? (
          <span className="text-subtle-foreground mt-1 block font-mono text-[9px] tracking-widest uppercase">
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  const rootClass = cn("group flex min-w-0 items-center gap-3", className);

  if (href) {
    return (
      <Link href={href} className={rootClass} onClick={onClick}>
        {body}
      </Link>
    );
  }

  return (
    <div className={rootClass} onClick={onClick} onKeyDown={undefined}>
      {body}
    </div>
  );
}
