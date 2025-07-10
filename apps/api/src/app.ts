import cors from 'cors'
import express from 'express'
import { expressMiddleWare } from '@ototabi/trpc'

const app = express()

app.use(
  cors({
    origin: 'http://your-frontend-domain.com', // Replace with your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
)

app.use('/trpc', expressMiddleWare)

app.use(express.json())

export default app
