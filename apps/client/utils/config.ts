import { env } from '../env'

const configMap = {
  frontendUrl: env.NEXT_PUBLIC_APP_URL,
  apiBaseUrl: env.NEXT_PUBLIC_API_URL,
  liveKitUrl: env.NEXT_PUBLIC_LIVEKIT_URL,
  nodeEnv: env.NODE_ENV,
} as const

type ConfigKey = keyof typeof configMap

const config = {
  getConfig: <K extends ConfigKey>(key: K): (typeof configMap)[K] => configMap[key],
}

if (typeof window !== 'undefined' && env.NODE_ENV === 'development') {
  console.log('Config:', config.getConfig('liveKitUrl'))
}

export default config
