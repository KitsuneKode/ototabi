import superjson from 'superjson'
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'

/**
 * Creates and returns a new QueryClient instance with custom default options.
 *
 * The returned QueryClient is configured with a 30-second stale time for queries and a custom dehydration policy that includes queries with a 'pending' status.
 * @returns A configured QueryClient instance.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  })
}
