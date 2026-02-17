import { Request, Response } from "express";
import { hashPassword, comparePassword, signToken } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const hashed = await hashPassword(password);

  // ⚠️ aquí luego va DB
  const user = { id: "uuid-demo", email };

  const token = signToken(user);

  res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // ⚠️ mock temporal
  const passwordHash = await hashPassword("123456");

  const isValid = await comparePassword(password, passwordHash);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: "uuid-demo", email });
  res.json({ token });
};