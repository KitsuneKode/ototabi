import express from 'express'
import { auth } from '@/lib/auth'
import { toNodeHandler } from 'better-auth/node'

const app = express()

app.all('/api/auth/{*slug}', toNodeHandler(auth))
// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth

app.use(express.json())

export default app
