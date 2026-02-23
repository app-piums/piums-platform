import { Request, Response, NextFunction } from "express";
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
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error(`Error: ${err.message}`, "ERROR_HANDLER", {
    url: req.url,
    method: req.method,
    stack: err.stack,
  });

  // Si es un AppError (error controlado)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Error de validación de Zod
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation Error",
      details: (err as any).errors,
    });
  }

  // Error de CORS
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed",
    });
  }

  // Error genérico no controlado
  const statusCode = 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal Server Error" 
    : err.message;

  res.status(statusCode).json({
    error: message,
    statusCode,
  });
};

// Handler para 404
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
};
