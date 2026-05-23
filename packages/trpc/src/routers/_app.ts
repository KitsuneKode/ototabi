import { authRouter } from './auth'
import { userRouter } from './user'
import { roomsRouter } from './rooms'
import { uploadsRouter } from './uploads'
import { createTRPCRouter } from '../trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  rooms: roomsRouter,
  uploads: uploadsRouter,
})

export type AppRouter = typeof appRouter
