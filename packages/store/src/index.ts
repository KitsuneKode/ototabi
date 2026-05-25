import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://127.0.0.1:5432/ototabi";

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  return globalThis.prisma;
}

/** Lazy singleton — safe to import in unit tests that never touch the database. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? (value as CallableFunction).bind(client) : value;
  },
});

declare global {
  var prisma: PrismaClient | undefined;
}

export * from "./generated/client";
