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
  _next: NextFunction
) => {
  // Log del error
  logger.error("Error capturado", "ERROR_HANDLER", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Error de validación de Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // AppError (errores operacionales)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Errores no manejados
  return res.status(500).json({
    status: "error",
    message: "Error interno del servidor",
  });
};
