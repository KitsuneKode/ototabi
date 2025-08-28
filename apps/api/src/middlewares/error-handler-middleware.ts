import { logger } from '@/utils/logger'
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express'

export const errorHandler = (
  error: ErrorRequestHandler,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error('Error occurred in path', req.path, ':', error)

  res.status(500).json({ error: 'Internal Server Error' })
}
