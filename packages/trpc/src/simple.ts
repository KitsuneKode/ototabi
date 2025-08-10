// import superjson from 'superjson'
// import { z, ZodError } from 'zod/v4'
// import { authRouter } from './routers/auth'
// import { userRouter } from './routers/user'
// import { prisma as db } from '@ototabi/store'
// import { uploadsRouter } from './routers/uploads'
// import { initTRPC, TRPCError } from '@trpc/server'
// import { auth, fromNodeHeaders } from '@ototabi/auth/server'
// import * as trpcExpress from '@trpc/server/adapters/express'
// import { createExpressMiddleware } from '@trpc/server/adapters/express'
// import {
//   authRouterSimple,
//   userRouterSimple,
//   type AuthRouterSimple,
//   type UserRouterSimple,
// } from './routers'
// import {
//   publicProcedure,
//   createTRPCContext,
//   createTRPCRouter,
//   protectedProcedure,
// } from '@ototabi/trpc/utils/simpleutiles'

// const appRouter = createTRPCRouter({
//   hello: publicProcedure
//     .input(
//       z.object({
//         text: z.string(),
//       }),
//     )
//     .query((opts) => {
//       return {
//         greeting: `hello ${opts.input.text}`,
//       }
//     }),
//   auth: authRouterSimple as AuthRouterSimple,
//   user: userRouterSimple as UserRouterSimple,
// })
// // export type definition of API

// const expressMiddleWareSimple = createExpressMiddleware({
//   router: appRouter,
//   createContext: createTRPCContext,
// })

// export { expressMiddleWareSimple, appRouter, createTRPCContext }
// export type AppRouter = typeof appRouter
