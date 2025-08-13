import 'server-only' // <-- ensure this file cannot be imported from the client
import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@ototabi/auth/server'
import { createCaller } from '@ototabi/trpc'
import { prisma as db } from '@ototabi/store'
import { makeQueryClient } from './query-client'

export const getQueryClient = cache(makeQueryClient)

export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return createCaller({ session, db })
})
