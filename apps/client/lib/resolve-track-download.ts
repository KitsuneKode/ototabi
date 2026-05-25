import type { AppRouter } from "@ototabi/trpc";
import type { createTRPCClient } from "@trpc/client";

type TrpcVanillaClient = ReturnType<typeof createTRPCClient<AppRouter>>;

export async function resolveTrackDownloadUrl(
  trpcClient: TrpcVanillaClient,
  mediaRef: string | null | undefined,
): Promise<string | null> {
  if (!mediaRef) return null;
  try {
    const { url } = await trpcClient.uploads.getSignedDownloadUrl.mutate({ key: mediaRef });
    return url;
  } catch {
    return mediaRef.startsWith("http") ? mediaRef : null;
  }
}
