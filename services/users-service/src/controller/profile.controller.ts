import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProfileService } from "../services/profile.service";
import { UsersService } from "../services/users.service";
import { cloudinaryProvider } from "../providers/cloudinary.provider";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const profileService = new ProfileService();
const usersService = new UsersService();

/**
 * POST /api/users/me/profile - Crear perfil público
 */
export const createProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);

    const { displayName, slug, bio, tagline, profileType, city, country,
      website, instagram, facebook, twitter, linkedin, youtube, tiktok,
      keywords, categories } = req.body;

    if (!displayName || !slug) {
      throw new AppError(400, "displayName y slug son requeridos");
    }

    const profile = await profileService.createProfile({
      userId: user.id,
      displayName,
      slug,
      bio,
      tagline,
      profileType,
      city,
      country,
      website,
      instagram,
      facebook,
      twitter,
      linkedin,
      youtube,
      tiktok,
      keywords,
      categories,
    });

    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/profile - Obtener mi perfil
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);
    const profile = await profileService.getProfileByUserId(user.id);

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/profile/:slug - Obtener perfil público por slug
 */
export const getProfileBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const profile = await profileService.getProfileBySlug(slug);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/me/profile - Actualizar mi perfil
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);

    const { displayName, slug, bio, tagline, visibility, city, cityId, state,
      country, website, instagram, facebook, twitter, linkedin, youtube, tiktok,
      keywords, categories } = req.body;

    const profile = await profileService.updateProfile(user.id, {
      displayName, slug, bio, tagline, visibility, city, cityId, state,
      country, website, instagram, facebook, twitter, linkedin, youtube, tiktok,
      keywords, categories,
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/profile/cover - Subir foto de portada
 */
export const uploadCoverPhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    if (!req.file) throw new AppError(400, "No se proporcionó ningún archivo");

    const user = await usersService.getUserByAuthId(authId);

    // Upload to Cloudinary using same pattern as avatar
    const url = await cloudinaryProvider.uploadAvatar(req.file.buffer, `cover_${user.id}`);

    const profile = await profileService.updateCoverPhoto(user.id, url);

    logger.info("Cover photo uploaded", "PROFILE_CONTROLLER", { userId: user.id, url });

    res.json({ message: "Foto de portada actualizada", coverPhoto: url, profile });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/profile/cover - Eliminar foto de portada
 */
export const deleteCoverPhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const user = await usersService.getUserByAuthId(authId);
    const existing = await profileService.getProfileByUserId(user.id);

    if (existing.coverPhoto) {
      await cloudinaryProvider.deleteAvatar(existing.coverPhoto);
    }

    const profile = await profileService.updateCoverPhoto(user.id, "");

    res.json({ message: "Foto de portada eliminada", profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/profile/check-slug/:slug - Verificar disponibilidad de slug
 */
export const checkSlugAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const authId = req.user?.id;

    let excludeUserId: string | undefined;
    if (authId) {
      const user = await usersService.getUserByAuthId(authId).catch(() => null);
      excludeUserId = user?.id;
    }

    const available = await profileService.isSlugAvailable(slug, excludeUserId);
    res.json({ slug, available });
  } catch (error) {
    next(error);
  }
};
