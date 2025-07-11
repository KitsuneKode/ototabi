import cors from 'cors'
import express from 'express'
import config from '@/utils/config'
import { expressMiddleWare } from '@ototabi/trpc'
import liveKitAuthRouter from '@/routes/live-kit-auth'
import { toNodeHandler, auth } from '@ototabi/auth/server'
import { expressMiddleWareSimple } from '@ototabi/trpc/simp'
import { timingMiddleWare } from '@/middlewares/timing-middleware'

const app = express()

app.use(
  cors({
    origin: config.getConfig('frontendUrl'),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
)
app.use('/api/trpc', expressMiddleWareSimple)

app.use(timingMiddleWare)
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.use('/api/', liveKitAuthRouter)

export default app
