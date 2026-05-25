import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const storeRoot = fileURLToPath(new URL(".", import.meta.url));

// Monorepo: root `.env` first, then `packages/store/.env` overrides.
config({ path: resolve(storeRoot, "../../.env") });
config({ path: resolve(storeRoot, ".env"), override: true });

/**
 * Prisma CLI (format, validate, migrate) loads this file. The fallback is only for
 * format/validate when no `.env` exists — those commands do not open a connection.
 */
const DEFAULT_DATABASE_URL = "postgresql://127.0.0.1:5432/ototabi";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
