import cors from 'cors'
import express from 'express'

const app = express()

app.use(
  cors({
    origin: 'http://your-frontend-domain.com', // Replace with your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
)
export default app
