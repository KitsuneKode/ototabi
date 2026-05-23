import config from '@/utils/config'
import { logger } from '@/utils/logger'
import type { NextFunction, Request, Response } from 'express'

export const timingMiddleWare = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now()

  if (config.getConfig('nodeEnv') === 'development') {
    const waitMs = Math.floor(Math.random() * 400) + 100
    setTimeout(() => {
      next()
      const end = Date.now()
      logger.info(`[TIMING] ${req.path} took ${end - start}ms to execute`)
    }, waitMs)
  } else {
    res.on('finish', () => {
      const end = Date.now()
      logger.info(`[TIMING] ${req.path} took ${end - start}ms to execute`)
    })
    next()
  }
}
