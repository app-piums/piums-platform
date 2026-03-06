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
  logger.error(err.message, "ERROR_HANDLER", {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Error de validación Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Datos inválidos",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Error de aplicación controlado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Error desconocido
  res.status(500).json({
    status: "error",
    message: "Error interno del servidor",
  });
};
