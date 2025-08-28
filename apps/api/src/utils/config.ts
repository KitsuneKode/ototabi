import { ConfigLoader } from '@ototabi/common/config-loader'

const authConfigSchema = {
  jwtSecret: () => process.env.JWT_SECRET || '',
  port: () => Number(process.env.PORT) || 8080,
  frontendUrl: () => process.env.FRONTEND_URL || '',
  databaseUrl: () => process.env.DATABASE_URL || '',
  nodeEnv: () => process.env.NODE_ENV || 'development',
  betterAuthUrl: () => process.env.BETTER_AUTH_URL || '',
  allowedOrigins: () => process.env.ALLOWED_ORIGINS || '',
  betterAuthSecret: () => process.env.BETTER_AUTH_SECRET || '',
  liveKitApiKey: () => process.env.LIVEKIT_API_KEY || '',
  liveKitApiSecret: () => process.env.LIVEKIT_API_SECRET || '',
  liveKitUrl: () => process.env.LIVEKIT_URL || '',
}

const config = ConfigLoader.getInstance(authConfigSchema, 'auth')
export default config
