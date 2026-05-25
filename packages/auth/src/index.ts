import { prisma } from "@ototabi/store";
import { betterAuth } from "better-auth";
export { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

/**
 * Public origin for auth URLs and cookies — NOT the Express listen port.
 *
 * Better Auth docs: baseURL is "the root URL where your application server is hosted"
 * from the *client's* perspective (see createAuthClient baseURL in their guides).
 *
 * Ototabi dev layout:
 * - Handler process: Express :8080 (`app.all("/api/auth/*", toNodeHandler(auth))`)
 * - Browser calls:     Next :3000/api/auth/* (rewritten to :8080 in next.config.js)
 * - Therefore:         BETTER_AUTH_URL=http://localhost:3000 and authClient uses origin :3000
 *
 * If the client called :8080 directly (no proxy), baseURL would be :8080 and you'd need
 * cross-origin cookie settings (trustedOrigins + SameSite=None). See Better Auth "Cookies".
 */
const appBaseUrl =
  process.env.BETTER_AUTH_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appBaseUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [bearer()],
  socialProviders: {
    github: {
      enabled: false,
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      enabled: false,
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:8080",
  ],
});
