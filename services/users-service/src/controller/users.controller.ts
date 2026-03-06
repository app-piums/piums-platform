import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UsersService } from "../services/users.service";
import {
  createUserSchema,
  updateUserSchema,
  addressSchema,
} from "../schemas/users.schema";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const usersService = new UsersService();

/**
 * POST /api/users - Crear usuario (uso interno desde auth-service)
 */
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await usersService.createUser(validatedData);

    // No incluir información sensible
    const { ...userResponse } = user;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id - Obtener perfil de usuario
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const user = await usersService.getUserById(id);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me - Obtener perfil del usuario autenticado
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }

    const user = await usersService.getUserByAuthId(authId);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id - Actualizar perfil
 */
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await usersService.updateUser(id, validatedData);

    logger.info("Perfil actualizado", "USERS_CONTROLLER", { userId: id });
    res.json({ user, message: "Perfil actualizado exitosamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id - Eliminar cuenta
 */
export const deleteUserAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await usersService.deleteUser(id);

    logger.info("Cuenta eliminada", "USERS_CONTROLLER", { userId: id });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/addresses - Agregar dirección
 */
export const addAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const validatedData = addressSchema.parse(req.body);

    const address = await usersService.addAddress(id, validatedData);

    res.status(201).json({ address });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/addresses/:addressId - Actualizar dirección
 */
export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const addressId = req.params.addressId as string;
    const validatedData = addressSchema.partial().parse(req.body);

    const address = await usersService.updateAddress(addressId, id, validatedData);

    res.json({ address });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id/addresses/:addressId - Eliminar dirección
 */
export const deleteAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const addressId = req.params.addressId as string;
    const result = await usersService.deleteAddress(addressId, id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
