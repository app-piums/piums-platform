import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UsersService } from '../services/users.service';
import { cloudinaryProvider } from '../providers/cloudinary.provider';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const usersService = new UsersService();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

async function syncAvatarToAuthService(authId: string, avatarUrl: string | null) {
  try {
    await fetch(`${AUTH_SERVICE_URL}/internal/users/${authId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({ avatarUrl }),
    });
  } catch (err: any) {
    logger.warn('Could not sync avatar to auth-service', 'AVATAR_CONTROLLER', { authId, error: err.message });
  }
}

// Sync avatar to artists-service so the web dashboard reads it from artist.avatar
async function syncAvatarToArtistsService(token: string, avatarUrl: string | null) {
  try {
    await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar: avatarUrl }),
    });
  } catch (err: any) {
    logger.warn('Could not sync avatar to artists-service', 'AVATAR_CONTROLLER', { error: err.message });
  }
}

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
    const previousAvatar = user.avatar;

    // Subir nuevo avatar a Cloudinary antes de borrar el anterior
    const avatarUrl = await cloudinaryProvider.uploadAvatar(
      req.file.buffer,
      user.id
    );

    // Actualizar usuario con nueva URL de avatar
    const updatedUser = await usersService.updateUser(user.id, {
      avatar: avatarUrl,
    });

    // Borrar el avatar anterior solo si el upload y la DB actualizaron bien
    if (previousAvatar) {
      await cloudinaryProvider.deleteAvatar(previousAvatar);
    }

    // Sync to auth-service and artists-service (fire-and-forget)
    const token = req.headers.authorization?.substring(7) || '';
    syncAvatarToAuthService(authId, avatarUrl);
    syncAvatarToArtistsService(token, avatarUrl);

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

    // Sync removal to auth-service and artists-service
    const token = req.headers.authorization?.substring(7) || '';
    syncAvatarToAuthService(authId, null);
    syncAvatarToArtistsService(token, null);

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
