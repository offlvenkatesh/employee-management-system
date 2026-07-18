import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError, fromZodError } from "./errors";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND", 404));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const error = err instanceof ZodError ? fromZodError(err) : err;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      title: error.code,
      status: error.statusCode,
      detail: error.message,
      errors: error.details,
      request_id: req.id
    });
    return;
  }

  logger.error(
    {
      requestId: req.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    },
    "unhandled error"
  );

  res.status(500).json({
    title: "INTERNAL_SERVER_ERROR",
    status: 500,
    detail: "Unexpected server error",
    request_id: req.id
  });
}
