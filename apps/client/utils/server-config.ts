'use server'

import { ConfigLoader } from '@ototabi/common/config-loader'

const serverConfigSchema = {
  databaseUrl: () => process.env.DATABASE_URL || '',
  nodeEnv: () => process.env.NODE_ENV || 'development',
}

const serverConfig = ConfigLoader.getInstance(
  serverConfigSchema,
  'server-actions',
)

serverConfig.validate(['databaseUrl', 'nodeEnv'])

if (serverConfig.getConfig('nodeEnv') === 'development') {
  console.log('Configuration loaded:', serverConfig.getConfig('databaseUrl'))
}

export default serverConfig
