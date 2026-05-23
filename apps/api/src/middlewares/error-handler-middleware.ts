import type { NextFunction, Request, Response } from "express";

import { logger } from "@/utils/logger";

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error occurred in path ${_req.path}:`, {
    message: error.message,
    stack: error.stack,
  });

  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : "statusCode" in error && typeof (error as any).statusCode === "number"
        ? (error as any).statusCode
        : 500;

  res.status(status).json({
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
