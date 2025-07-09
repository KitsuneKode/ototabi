import { z } from 'zod'
import { prisma } from '@ototabi/store'
import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '@/trpc'

export const userRouter = {
  getUser: publicProcedure.input(z.string()).query((opts) => {
    opts.input // string
    return { id: opts.input, name: 'Bilbo' }
  }),
  createUser: protectedProcedure
    .input(z.object({ name: z.string().min(5) }))
    .mutation(async (opts) => {
      // use your ORM of classhoice
      return prisma.user.create({
        data: opts.input,
      })
    }),
} satisfies TRPCRouterRecord
