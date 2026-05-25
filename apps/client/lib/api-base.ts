import config from "@/utils/config";

/**
 * API origin for fetch/tRPC from the Next.js app.
 * In the browser we use same-origin paths proxied by `next.config.js` rewrites
 * so Better Auth session cookies attach to :3000, not :8080.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return config.getConfig("apiBaseUrl");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}
