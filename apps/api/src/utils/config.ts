import { env } from "../../env";

const configMap = {
  jwtSecret: env.BETTER_AUTH_SECRET,
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,
  databaseUrl: env.DATABASE_URL,
  nodeEnv: env.NODE_ENV,
  betterAuthUrl: env.BETTER_AUTH_URL,
  allowedOrigins: env.ALLOWED_ORIGINS || "",
  betterAuthSecret: env.BETTER_AUTH_SECRET,
  liveKitApiKey: env.LIVEKIT_API_KEY,
  liveKitApiSecret: env.LIVEKIT_API_SECRET,
  liveKitUrl: env.LIVEKIT_URL,
} as const;

type ConfigKey = keyof typeof configMap;

const config = {
  getConfig: <K extends ConfigKey>(key: K): (typeof configMap)[K] => configMap[key],
  validate: () => {},
};

export default config;
