import type { NextFunction, Request } from 'express'

type AsyncHandlerControllerType = (
  req: Request,
  res: any,
  next: NextFunction,
) => Promise<any>

export const asyncHandler =
  (fn: AsyncHandlerControllerType): AsyncHandlerControllerType =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
