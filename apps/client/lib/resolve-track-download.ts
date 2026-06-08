import type { AppRouter } from "@ototabi/trpc";
import type { createTRPCClient } from "@trpc/client";

type TrpcVanillaClient = ReturnType<typeof createTRPCClient<AppRouter>>;

export async function resolveTrackDownloadUrl(
  trpcClient: TrpcVanillaClient,
  mediaRef: string | null | undefined,
): Promise<string | null> {
  if (!mediaRef) return null;
  try {
    const map = await resolveTrackDownloadUrls(trpcClient, [mediaRef]);
    return map.get(mediaRef) ?? null;
  } catch {
    return mediaRef.startsWith("http") ? mediaRef : null;
  }
}

export async function resolveTrackDownloadUrls(
  trpcClient: TrpcVanillaClient,
  mediaRefs: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const keys = [...new Set(mediaRefs.filter((ref): ref is string => Boolean(ref)))];
  const result = new Map<string, string>();
  if (keys.length === 0) return result;

  try {
    const { urls } = await trpcClient.uploads.getSignedDownloadUrls.query({ keys });
    for (const key of keys) {
      const url = urls[key];
      if (url) result.set(key, url);
    }
    return result;
  } catch {
    for (const key of keys) {
      if (key.startsWith("http")) result.set(key, key);
    }
    return result;
  }
}
