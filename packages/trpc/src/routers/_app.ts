import { authRouter } from './auth'
import { userRouter } from './user'
import { roomsRouter } from './rooms'
import { uploadsRouter } from './uploads'
import { chatRouter } from './chat'
import { createTRPCRouter } from '../trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  rooms: roomsRouter,
  uploads: uploadsRouter,
  chat: chatRouter,
})

export type AppRouter = typeof appRouter
