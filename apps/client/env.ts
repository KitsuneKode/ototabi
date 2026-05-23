import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8080"),
    NEXT_PUBLIC_LIVEKIT_URL: z.string().url(),
    NEXT_PUBLIC_AWS_ACCESS_KEY_ID: z.string().optional(),
    NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: z.string().optional(),
    NEXT_PUBLIC_AWS_REGION: z.string().optional(),
    NEXT_PUBLIC_S3_BUCKET_NAME: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    NEXT_PUBLIC_AWS_ACCESS_KEY_ID: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV,
  },
});
