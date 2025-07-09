import { appRouter } from '@/routers'
import { createTRPCContext } from '@/trpc'
import type { AppRouter } from '@/routers'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>

export { createTRPCContext, appRouter }
export type { AppRouter, RouterInputs, RouterOutputs }
