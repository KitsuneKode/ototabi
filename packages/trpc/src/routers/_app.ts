import { authRouter } from './auth'
import { userRouter } from './user'
import { uploadsRouter } from './uploads'
import { createTRPCRouter } from '../trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  uploads: uploadsRouter,
})

export type AppRouter = typeof appRouter
