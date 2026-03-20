import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UsersService } from '../services/users.service';
import { cloudinaryProvider } from '../providers/cloudinary.provider';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const usersService = new UsersService();

/**
 * POST /api/users/me/avatar - Subir avatar
 */
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, 'No autenticado');
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó ningún archivo');
    }

    // Obtener usuario
    const user = await usersService.getUserByAuthId(authId);

    // Si ya tiene avatar, eliminarlo de Cloudinary
    if (user.avatar) {
      await cloudinaryProvider.deleteAvatar(user.avatar);
    }

    // Subir nuevo avatar a Cloudinary
    const avatarUrl = await cloudinaryProvider.uploadAvatar(
      req.file.buffer,
      user.id
    );

    // Actualizar usuario con nueva URL de avatar
    const updatedUser = await usersService.updateUser(user.id, {
      avatar: avatarUrl,
    });

    logger.info('Avatar uploaded successfully', 'AVATAR_CONTROLLER', {
      userId: user.id,
      avatarUrl,
    });

    res.json({
      message: 'Avatar actualizado exitosamente',
      avatar: avatarUrl,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/avatar - Eliminar avatar
 */
export const deleteAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, 'No autenticado');
    }

    // Obtener usuario
    const user = await usersService.getUserByAuthId(authId);

    if (!user.avatar) {
      throw new AppError(400, 'El usuario no tiene avatar');
    }

    // Eliminar de Cloudinary
    await cloudinaryProvider.deleteAvatar(user.avatar);

    // Actualizar usuario (remover avatar)
    const updatedUser = await usersService.updateUser(user.id, {
      avatar: null,
    });

    logger.info('Avatar deleted successfully', 'AVATAR_CONTROLLER', {
      userId: user.id,
    });

    res.json({
      message: 'Avatar eliminado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
