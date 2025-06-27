import { ConfigLoader } from '@repo/common/config-loader'

const backendConfigSchema = {
  jwtSecret: () => process.env.JWT_SECRET || '',
  port: () => Number(process.env.PORT) || 8080,
  frontendUrl: () => process.env.FRONTEND_URL || '',
}

export const config = ConfigLoader.getInstance(backendConfigSchema, 'backend')
