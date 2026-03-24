import { PrismaClient } from '@prisma/client';

import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// Using string literals for enums — Prisma client will be regenerated on deploy
type ProfileType = "USER" | "ARTIST" | "BOTH";
type ProfileVisibility = "PUBLIC" | "PRIVATE" | "HIDDEN";

const prisma = new PrismaClient();

export interface CreateProfileData {
  userId: string;
  displayName: string;
  slug: string;
  profileType?: ProfileType;
  bio?: string;
  tagline?: string;
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  keywords?: string[];
  categories?: string[];
}

export interface UpdateProfileData {
  displayName?: string;
  slug?: string;
  bio?: string;
  tagline?: string;
  visibility?: ProfileVisibility;
  city?: string;
  cityId?: string;
  state?: string;
  country?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  keywords?: string[];
  categories?: string[];
  avatar?: string;
  coverPhoto?: string;
}

export class ProfileService {
  /**
   * Crear perfil para un usuario
   */
  async createProfile(data: CreateProfileData) {
    try {
      // Verificar que no exista perfil para este usuario
      const existing = await prisma.profile.findUnique({
        where: { userId: data.userId },
      });
      if (existing) {
        throw new AppError(409, "El usuario ya tiene un perfil");
      }

      // Verificar que el slug no esté en uso
      const slugTaken = await prisma.profile.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        throw new AppError(409, "El slug ya está en uso");
      }

      const profile = await prisma.profile.create({
        data: {
          userId: data.userId,
          displayName: data.displayName,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
          profileType: data.profileType ?? "USER",
          bio: data.bio,
          tagline: data.tagline,
          city: data.city,
          country: data.country,
          website: data.website,
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          linkedin: data.linkedin,
          youtube: data.youtube,
          tiktok: data.tiktok,
          keywords: data.keywords ?? [],
          categories: data.categories ?? [],
        },
        include: { user: { select: { email: true, nombre: true, avatar: true } } },
      });

      logger.info("Perfil creado", "PROFILE_SERVICE", {
        profileId: profile.id,
        userId: data.userId,
      });

      return profile;
    } catch (error) {
      logger.error("Error creando perfil", "PROFILE_SERVICE", { error });
      throw error;
    }
  }

  /**
   * Obtener perfil por userId
   */
  async getProfileByUserId(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, nombre: true } } },
    });

    if (!profile) {
      throw new AppError(404, "Perfil no encontrado");
    }

    return profile;
  }

  /**
   * Obtener perfil público por slug
   */
  async getProfileBySlug(slug: string) {
    const profile = await prisma.profile.findUnique({
      where: { slug },
      include: { user: { select: { nombre: true, avatar: true } } },
    });

    if (!profile) {
      throw new AppError(404, "Perfil no encontrado");
    }

    if (profile.visibility === "HIDDEN") {
      throw new AppError(404, "Perfil no encontrado");
    }

    // Increment view count (fire and forget)
    prisma.profile
      .update({
        where: { slug },
        data: { viewCount: { increment: 1 }, lastActive: new Date() },
      })
      .catch(() => {});

    return profile;
  }

  /**
   * Actualizar perfil
   */
  async updateProfile(userId: string, data: UpdateProfileData) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(404, "Perfil no encontrado");
    }

    // Validar slug único si se cambia
    if (data.slug && data.slug !== profile.slug) {
      const slugTaken = await prisma.profile.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        throw new AppError(409, "El slug ya está en uso");
      }
      data.slug = data.slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    }

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { user: { select: { email: true, nombre: true } } },
    });

    logger.info("Perfil actualizado", "PROFILE_SERVICE", {
      profileId: updated.id,
      userId,
    });

    return updated;
  }

  /**
   * Actualizar foto de portada (cover photo)
   */
  async updateCoverPhoto(userId: string, coverPhotoUrl: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(404, "Perfil no encontrado");
    }

    return prisma.profile.update({
      where: { userId },
      data: { coverPhoto: coverPhotoUrl, updatedAt: new Date() },
    });
  }

  /**
   * Actualizar avatar del perfil (sincronizado con users-service)
   */
  async updateProfileAvatar(userId: string, avatarUrl: string | null) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null; // No error: perfil puede no existir aún

    return prisma.profile.update({
      where: { userId },
      data: { avatar: avatarUrl, updatedAt: new Date() },
    });
  }

  /**
   * Eliminar perfil
   */
  async deleteProfile(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(404, "Perfil no encontrado");
    }

    await prisma.profile.delete({ where: { userId } });

    logger.info("Perfil eliminado", "PROFILE_SERVICE", {
      profileId: profile.id,
      userId,
    });
  }

  /**
   * Verificar si slug está disponible
   */
  async isSlugAvailable(slug: string, excludeUserId?: string) {
    const profile = await prisma.profile.findUnique({ where: { slug } });
    if (!profile) return true;
    if (excludeUserId && profile.userId === excludeUserId) return true;
    return false;
  }

  /**
   * Buscar perfiles públicos
   */
  async searchProfiles(query: string, limit = 10) {
    return prisma.profile.findMany({
      where: {
        visibility: { not: "HIDDEN" },
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { keywords: { hasSome: [query] } },
        ],
      },
      take: limit,
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatar: true,
        tagline: true,
        profileType: true,
        isVerified: true,
        city: true,
        country: true,
        averageRating: true,
        totalReviews: true,
      },
    });
  }
}
