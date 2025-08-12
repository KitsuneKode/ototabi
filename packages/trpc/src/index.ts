import { createTRPCContext } from './trpc'
import { appRouter } from './routers/_app'
import { createCallerFactory } from './trpc'
import type { AppRouter } from './routers/_app'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>

const expressMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
})

const createCaller = createCallerFactory(appRouter)

export { appRouter, expressMiddleWare, createTRPCContext, createCaller }
export type { AppRouter, RouterInputs, RouterOutputs }
