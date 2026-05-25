import { auth, fromNodeHeaders } from "@ototabi/auth/server";
import { prisma as db } from "@ototabi/store";
import { initTRPC, TRPCError } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

export const createTRPCContext = async ({ req }: trpcExpress.CreateExpressContextOptions) => {
  const headers = fromNodeHeaders(req.headers);

  const session = await auth.api.getSession({
    headers,
  });

  let userRole: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    userRole = user?.role ?? null;
  }

  return {
    session,
    db,
    userRole,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const mergeTRPCRouters = t.mergeRouters;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

import { prisma } from "@ototabi/store";

const PLAN_ORDER: Record<string, number> = { TRIAL: 0, CREATOR: 1, PRO: 2, STUDIO: 3 };

export function requirePlan(minimum: string) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const sub = await prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
    const currentPlan = sub?.plan || "TRIAL";
    if ((PLAN_ORDER[currentPlan] || 0) < (PLAN_ORDER[minimum] || 0)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires the ${minimum} plan or higher`,
      });
    }
    return next();
  });
}

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/** Host accounts only — blocks Better Auth guest sessions from host console APIs. */
export const hostProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.userRole === "guest") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Guest accounts cannot access the host console",
    });
  }
  return next({ ctx });
});
