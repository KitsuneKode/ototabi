/**
 * Minimal cn() — joins class strings, filters falsy values.
 * No external deps needed since this project doesn't bundle clsx/tailwind-merge.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
