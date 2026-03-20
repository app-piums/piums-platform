import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod validation error
  if (err instanceof ZodError) {
    logger.warn("Validation error", "ERROR_HANDLER", {
      path: req.path,
      errors: err.errors,
    });

    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // App error
  if (err instanceof AppError) {
    logger.error(err.message, "ERROR_HANDLER", {
      path: req.path,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Unknown error
  logger.error("Internal server error", "ERROR_HANDLER", {
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
