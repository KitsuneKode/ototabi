import helmet from 'helmet'
import express from 'express'
import config from '@/utils/config'
import cors, { type CorsOptions } from 'cors'
import { expressMiddleWare } from '@ototabi/trpc'
import liveKitAuthRouter from '@/routes/live-kit-auth'
import { toNodeHandler, auth } from '@ototabi/auth/server'
import { timingMiddleWare } from '@/middlewares/timing-middleware'
import { errorHandler } from './middlewares/error-handler-middleware'

const app = express()

const isDev = config.getConfig('nodeEnv') === 'development'

const allowedOrigins = [
  ...new Set(
    [
      config.getConfig('frontendUrl'),
      'http://localhost:3000',
      'http://localhost:8080',
      ...(config.getConfig('allowedOrigins')
        ? config
            .getConfig('allowedOrigins')
            .split(',')
            .map((s: string) => s.trim())
        : []),
    ].filter(Boolean),
  ),
]

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || isDev || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
}

app.use(cors(corsOptions))
app.use(helmet())

// Better Auth handler must come BEFORE express.json()
// https://www.better-auth.com/docs/integrations/express
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.use(timingMiddleWare)

app.use('/api/trpc', expressMiddleWare)

app.use('/api/', liveKitAuthRouter)

app.use(errorHandler)

export default app
