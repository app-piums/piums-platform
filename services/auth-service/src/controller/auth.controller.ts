import { Request, Response } from "express";
import { hashPassword, comparePassword, signToken } from "../services/auth.service";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

export const register = async (req: Request, res: Response) => {
  try {
    // Validar datos con Zod
    const validatedData = registerSchema.parse(req.body);
    const { nombre, email, password, pais, codigoPais, telefono } = validatedData;

    const hashed = await hashPassword(password);

    // ⚠️ aquí luego va DB
    const user = {
      id: "uuid-demo",
      nombre,
      email,
      pais,
      telefono: `${codigoPais}${telefono}`,
    };

    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error.errors) {
      // Error de validación de Zod
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.errors.map((e: any) => e.message),
      });
    }
    res.status(500).json({ message: "Error interno del servidor" });
  }
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