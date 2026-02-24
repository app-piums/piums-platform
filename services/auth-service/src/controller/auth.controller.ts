import { Request, Response, NextFunction } from "express";
import { 
  hashPassword, 
  comparePassword, 
  signToken, 
  signRefreshToken,
  verifyRefreshToken,
  verifyToken
} from "../services/auth.service";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// 🗄️ Mock temporal de "base de datos" (reemplazar con Prisma)
const mockUsers: any[] = [];

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos con Zod
    const validatedData = registerSchema.parse(req.body);
    const { nombre, email, password, role, pais, codigoPais, telefono } = validatedData;

    // 🔴 Validar unicidad de email
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new AppError(400, "Este correo electrónico ya está registrado");
    }

    // Hash de contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario (mock temporal - aquí iría Prisma)
    const user = {
      id: `user_${Date.now()}`,
      nombre,
      email,
      passwordHash, // 🔴 Guardamos el hash
      role, // 🔴 Guardamos el rol
      pais,
      telefono: `${codigoPais}${telefono}`,
      createdAt: new Date(),
    };

    mockUsers.push(user);

    logger.info("Usuario registrado exitosamente", "AUTH_CONTROLLER", { 
      userId: user.id, 
      email: user.email 
    });

    // Generar tokens
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    // No enviar el passwordHash al cliente
    const { passwordHash: _, ...userResponse } = user;

    res.status(201).json({ 
      user: userResponse, 
      token,
      refreshToken 
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos con Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 🔴 Buscar usuario real en "base de datos"
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      logger.warn("Intento de login con email no registrado", "AUTH_CONTROLLER", { email });
      throw new AppError(401, "Credenciales inválidas");
    }

    // 🔴 Verificar contraseña real
    const isValid = await comparePassword(password, user.passwordHash);
    
    if (!isValid) {
      logger.warn("Intento de login con contraseña incorrecta", "AUTH_CONTROLLER", { 
        userId: user.id, 
        email 
      });
      throw new AppError(401, "Credenciales inválidas");
    }

    logger.info("Login exitoso", "AUTH_CONTROLLER", { userId: user.id, email });

    // Generar tokens
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    res.json({ 
      token,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, "Refresh token requerido");
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || typeof decoded === 'string') {
      throw new AppError(401, "Refresh token inválido o expirado");
    }

    // Buscar usuario
    const user = mockUsers.find(u => u.id === (decoded as any).id);

    if (!user) {
      throw new AppError(401, "Usuario no encontrado");
    }

    // Generar nuevo access token
    const newToken = signToken({ id: user.id, email: user.email });

    res.json({ token: newToken });
  } catch (error: any) {
    next(error);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Token no proporcionado");
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded || typeof decoded === 'string') {
      throw new AppError(401, "Token inválido o expirado");
    }

    // Buscar usuario
    const user = mockUsers.find(u => u.id === (decoded as any).id);

    if (!user) {
      throw new AppError(401, "Usuario no encontrado");
    }

    // Retornar información del usuario
    res.json({
      userId: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      pais: user.pais,
      telefono: user.telefono,
    });
  } catch (error: any) {
    next(error);
  }
};