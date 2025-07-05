import { ConfigLoader } from '@ototabi/common/config-loader'

const backendConfigSchema = {
  jwtSecret: () => process.env.JWT_SECRET || '',
  port: () => Number(process.env.PORT) || 8080,
  frontendUrl: () => process.env.FRONTEND_URL || '',
  databaseUrl: () => process.env.DATABASE_URL || '',
}

export const config = ConfigLoader.getInstance(backendConfigSchema, 'api')
