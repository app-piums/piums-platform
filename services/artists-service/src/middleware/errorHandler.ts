import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    logger.warn("Validation error", "ERROR_HANDLER", {
      path: req.path,
      errors: err.errors,
    });
    return res.status(400).json({
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Errores operacionales conocidos
  if (err instanceof AppError) {
    logger.warn(err.message, "ERROR_HANDLER", {
      statusCode: err.statusCode,
      path: req.path,
    });
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Errores inesperados
  logger.error("Unhandled error", "ERROR_HANDLER", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json({
    message: "Error interno del servidor",
  });
};
