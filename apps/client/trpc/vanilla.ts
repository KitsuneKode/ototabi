import type { AppRouter } from "@ototabi/trpc";

import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { SuperJSON } from "superjson";

import { getApiBaseUrl } from "@/lib/api-base";
import config from "@/utils/config";

function getUrl() {
  return `${getApiBaseUrl()}/api/trpc`;
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        config.getConfig("nodeEnv") === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      transformer: SuperJSON,
      url: getUrl(),
      headers: () => {
        const headers = new Headers();
        headers.set("x-trpc-source", "vanilla-client");
        return headers;
      },
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: "include", // essential for cookie auth sharing
        });
      },
    }),
  ],
});
