'use client'
// ^-- to make sure we can mount the Provider from a server component
import { useState } from 'react'
import config from '@/utils/config'
import { makeQueryClient } from './query-client'
import type { AppRouter } from '@ototabi/trpc/simp'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
let browserQueryClient: QueryClient
/**
 * Returns a React Query client instance, creating a new one per request on the server or reusing a singleton on the browser.
 *
 * Ensures that the same query client is reused across renders in the browser to prevent issues with React suspense and data consistency.
 * On the server, always creates a new client to avoid sharing state between requests.
 *
 * @returns The React Query client instance
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
/**
 * Constructs the full tRPC API endpoint URL using the configured API base URL.
 *
 * @returns The complete URL for the tRPC API endpoint.
 */
function getUrl() {
  const base = (() => {
    // if (typeof window !== 'undefined') return ''
    return config.getConfig('apiBaseUrl')
  })()
  return `${base}/api/trpc`
}

console.log(getUrl())

/**
 * Provides tRPC and React Query client contexts to its child components.
 *
 * Wraps children with both `QueryClientProvider` and `TRPCProvider`, ensuring that a properly configured React Query client and tRPC client are available throughout the component subtree.
 *
 * @param props - Contains the React children to be rendered within the provider context
 */
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getUrl(),
        }),
      ],
    }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
