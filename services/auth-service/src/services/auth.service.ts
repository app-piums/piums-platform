import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// 🔴 Validación crítica: JWT_SECRET debe estar definido en producción
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET no está definido en las variables de entorno", "AUTH_SERVICE");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
  logger.warn("Usando JWT_SECRET de desarrollo (NO USAR EN PRODUCCIÓN)", "AUTH_SERVICE");
}

const JWT_SECRET_FINAL = JWT_SECRET || "dev_secret_CHANGE_ME";
const REFRESH_SECRET_FINAL = REFRESH_SECRET || "refresh_dev_secret_CHANGE_ME";

export const hashPassword = (password: string) =>
  bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (payload: any) =>
  jwt.sign(payload, JWT_SECRET_FINAL, { expiresIn: "1h" });

export const signRefreshToken = (payload: any) =>
  jwt.sign(payload, REFRESH_SECRET_FINAL, { expiresIn: "7d" });

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET_FINAL);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET_FINAL);
  } catch (error) {
    return null;
  }
};