import { ConfigLoader } from '@ototabi/common/config-loader'

const authConfigSchema = {
  jwtSecret: () => process.env.JWT_SECRET || '',
  port: () => Number(process.env.PORT) || 8080,
  frontendUrl: () => process.env.FRONTEND_URL || '',
  databaseUrl: () => process.env.DATABASE_URL || '',
  nodeEnv: () => process.env.NODE_ENV || 'development',
}

const config = ConfigLoader.getInstance(authConfigSchema, 'auth')
export default config
