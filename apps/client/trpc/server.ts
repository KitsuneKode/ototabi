import 'server-only' // <-- ensure this file cannot be imported from the client
import { cache } from 'react'
// import superjson from 'superjson'
import config from '@/utils/config'
import { headers } from 'next/headers'
import { auth } from '@ototabi/auth/server'
// import { httpLink } from '@trpc/client/links/httpLink'
import { createCaller } from '@ototabi/trpc'
import { prisma as db } from '@ototabi/store'
// import { createTRPCClient } from '@trpc/client'
import { makeQueryClient } from './query-client'
// import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)
function getUrl() {
  const base = (() => {
    // if (typeof window !== 'undefined') return ''
    return config.getConfig('apiBaseUrl')
  })()
  return `${base}/api/trpc`
}

// export const trpc = createTRPCOptionsProxy({
//   router: appRouter,
//   client: createTRPCClient({
//     links: [
//       httpLink({
//         url: getUrl(),
//         transformer: superjson,
//         headers: () => {
//           const headers = new Headers()
//           headers.set('x-trpc-source', 'rsc')
//           return headers
//         },
//       }),
//     ],
//   }),
//   queryClient: getQueryClient,
// })

// export const caller = appRouter.createCaller({
//   session: await auth.api.getSession({
//     headers: new Headers(await headers()),
//   }),
//   db,
// })

export const trpc = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  console.log(session)
  return createCaller({ session, db })
})
