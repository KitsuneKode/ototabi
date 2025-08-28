import helmet from 'helmet'
import express from 'express'
import config from '@/utils/config'
import { Unauthorized } from 'http-errors'
import cors, { type CorsOptions } from 'cors'
import { expressMiddleWare } from '@ototabi/trpc'
import liveKitAuthRouter from '@/routes/live-kit-auth'
import { toNodeHandler, auth } from '@ototabi/auth/server'
import { timingMiddleWare } from '@/middlewares/timing-middleware'
import { errorHandler } from './middlewares/error-handler-middleware'

const app = express()

const corsOptions: CorsOptions = {
  credentials: true,
  origin(url, callback) {
    if (
      !url ||
      url != config.getConfig('frontendUrl')
      //|| config.getConfig('allowedOrigins')?.split(',').includes(url)
    ) {
      return callback(null, true)
    } else {
      const errorMsg = `CORS error: Origin ${url} is not allowed`
      callback(new Unauthorized(errorMsg), false)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}

app.use(cors(corsOptions))
app.use(helmet)

app.use('/api/trpc', expressMiddleWare)

app.use(timingMiddleWare)

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.use('/api/', liveKitAuthRouter)

app.use(errorHandler)

export default app
