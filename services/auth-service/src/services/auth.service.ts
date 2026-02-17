import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const hashPassword = (password: string) =>
  bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (payload: any) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });