import cors from 'cors'
import express from 'express'
import config from '@/utils/config'
import { expressMiddleWare } from '@ototabi/trpc'
import { expressMiddleWareSimple } from '@ototabi/trpc/simp'

const app = express()

app.use(
  cors({
    origin: config.getConfig('frontendUrl'),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
)

app.use('/api/trpc', expressMiddleWareSimple)

app.use(express.json())

export default app
